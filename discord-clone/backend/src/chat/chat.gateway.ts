import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MessagesService } from '../messages/messages.service';
import { ChannelsService } from '../channels/channels.service';
import { FriendshipsService } from '../friendships/friendships.service';
import { DmsService } from '../dms/dms.service';

interface AuthenticatedSocket extends Socket {
  userId: string;
  username: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');

  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private redis: RedisService,
    private messagesService: MessagesService,
    private channelsService: ChannelsService,
    private friendshipsService: FriendshipsService,
    private dmsService: DmsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) throw new Error('Token ausente');

      const payload = this.jwt.verify(token);
      client.userId = payload.sub;
      client.username = payload.username;

      await this.redis.setUserOnline(client.userId, client.id);

      client.join(`user:${client.userId}`);

      const memberships = await this.prisma.member.findMany({
        where: { userId: client.userId },
        select: { serverId: true },
      });
      memberships.forEach((m) => client.join(`server:${m.serverId}`));

      this.server.emit('presence:update', {
        userId: client.userId,
        status: 'ONLINE',
      });

      this.logger.log(`Cliente conectado: ${client.username} (${client.id})`);
    } catch (error: any) {
      this.logger.warn(
        `Conexão rejeitada: token inválido ou expirado (${client.id}) - ${error?.message || error}`,
      );
      client.emit('error', { message: 'Não autenticado ou token expirado' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    try {
      const voiceState = await this.redis.leaveVoiceChannelBySocket(client.id);
      if (voiceState) {
        await this.broadcastVoiceUpdate(voiceState.channelId);
      }

      const result = await this.redis.removeSocket(client.id);
      if (result && !result.stillOnline) {
        this.server.emit('presence:update', {
          userId: result.userId,
          status: 'OFFLINE',
        });
      }
      this.logger.log(`Cliente desconectado: ${client.id}`);
    } catch (err: any) {
      this.logger.error(`Erro no handleDisconnect (${client.id}): ${err?.message}`);
    }
  }

  private async broadcastVoiceUpdate(channelId: string) {
    try {
      if (!channelId) return;
      const memberIds = await this.redis.getVoiceChannelMembers(channelId);
      const users = await this.prisma.user.findMany({
        where: { id: { in: memberIds } },
        select: {
          id: true,
          username: true,
          discriminator: true,
          avatarUrl: true,
        },
      });

      const channel = await this.prisma.channel.findUnique({
        where: { id: channelId },
      });

      if (channel) {
        this.server.to(`server:${channel.serverId}`).emit('voice:update', {
          channelId,
          members: users,
        });
      } else {
        this.server.to(`voice:${channelId}`).emit('voice:update', {
          channelId,
          members: users,
        });
      }
    } catch (err: any) {
      this.logger.warn(`Erro no broadcastVoiceUpdate para ${channelId}: ${err?.message}`);
    }
  }

  // =====================================================================
  // VOZ
  // =====================================================================

  @SubscribeMessage('voice:join')
  async onVoiceJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string },
  ) {
    try {
      if (!data?.channelId) return { error: 'ChannelId inválido' };

      const channel = await this.prisma.channel.findUnique({
        where: { id: data.channelId },
      });

      if (channel) {
        if (channel.type !== 'VOICE')
          return { error: 'Esse canal não é de voz' };
        await this.channelsService.assertMembership(
          data.channelId,
          client.userId,
        );
      }

      await this.redis.joinVoiceChannel(
        data.channelId,
        client.userId,
        client.id,
      );
      client.join(`voice:${data.channelId}`);
      await this.broadcastVoiceUpdate(data.channelId);

      return { success: true };
    } catch (err: any) {
      return { error: err?.message || 'Falha ao conectar na sala de voz' };
    }
  }

  @SubscribeMessage('voice:leave')
  async onVoiceLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string },
  ) {
    try {
      await this.redis.leaveVoiceChannelBySocket(client.id);
      if (data?.channelId) {
        client.leave(`voice:${data.channelId}`);
        await this.broadcastVoiceUpdate(data.channelId);
      }
      return { success: true };
    } catch (err: any) {
      return { error: err?.message || 'Falha ao sair da sala de voz' };
    }
  }

  // =====================================================================
  // CANAIS DE TEXTO (servidor)
  // =====================================================================

  @SubscribeMessage('channel:join')
  async onJoinChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string },
  ) {
    try {
      if (!data?.channelId) return { error: 'ChannelId é obrigatório' };
      await this.channelsService.assertMembership(data.channelId, client.userId);
      client.join(`channel:${data.channelId}`);
      return { success: true };
    } catch (err: any) {
      return { error: err?.message || 'Falha ao entrar no canal' };
    }
  }

  @SubscribeMessage('channel:leave')
  onLeaveChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string },
  ) {
    if (data?.channelId) {
      client.leave(`channel:${data.channelId}`);
    }
    return { success: true };
  }

  @SubscribeMessage('message:send')
  async onSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string; content: string },
  ) {
    try {
      if (!data?.channelId) return { error: 'ChannelId é obrigatório' };
      if (!data?.content?.trim()) return { error: 'Mensagem vazia' };
      if (data.content.length > 2000) return { error: 'Mensagem muito longa' };

      const { member } = await this.channelsService.assertMembership(
        data.channelId,
        client.userId,
      );

      const message = await this.messagesService.create(
        data.channelId,
        client.userId,
        member.id,
        data.content.trim(),
      );

      this.server.to(`channel:${data.channelId}`).emit('message:new', message);

      const mentions = data.content.match(/@(\w+)/g);
      if (mentions) {
        const usernames = mentions.map((m) => m.substring(1));
        const mentionedUsers = await this.prisma.user.findMany({
          where: { username: { in: usernames } },
        });
        for (const u of mentionedUsers) {
          if (u.id !== client.userId) {
            this.server.to(`user:${u.id}`).emit('notification:new', {
              type: 'mention',
              message: `Você foi mencionado por ${client.username}`,
              channelId: data.channelId,
            });
          }
        }
      }

      return { success: true, message };
    } catch (err: any) {
      return { error: err?.message || 'Erro ao enviar mensagem' };
    }
  }

  @SubscribeMessage('typing:start')
  onTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string },
  ) {
    if (!data?.channelId) return;
    client.to(`channel:${data.channelId}`).emit('typing:update', {
      userId: client.userId,
      username: client.username,
      channelId: data.channelId,
      typing: true,
    });
  }

  @SubscribeMessage('typing:stop')
  onTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string },
  ) {
    if (!data?.channelId) return;
    client.to(`channel:${data.channelId}`).emit('typing:update', {
      userId: client.userId,
      username: client.username,
      channelId: data.channelId,
      typing: false,
    });
  }

  // =====================================================================
  // AMIZADES — notificações em tempo real
  // =====================================================================

  @SubscribeMessage('friend:request')
  async onFriendRequest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { username: string; discriminator?: string },
  ) {
    try {
      if (!data?.username) return { error: 'Username é obrigatório' };
      const friendship = await this.friendshipsService.sendRequest(
        client.userId,
        {
          username: data.username,
          discriminator: data.discriminator || '0000',
        },
      );

      if (friendship && 'receiverId' in friendship) {
        this.server
          .to(`user:${friendship.receiverId}`)
          .emit('friend:request:received', {
            friendshipId: friendship.id,
            from: friendship.requester,
          });

        this.server
          .to(`user:${friendship.receiverId}`)
          .emit('notification:new', {
            type: 'friend_request',
            message: `Novo pedido de amizade de ${friendship.requester.username}`,
          });
      }

      return { success: true, friendship };
    } catch (err: any) {
      return { error: err?.message || 'Erro ao enviar pedido de amizade' };
    }
  }

  @SubscribeMessage('friend:respond')
  async onFriendRespond(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { friendshipId: string; accept: boolean },
  ) {
    try {
      if (!data?.friendshipId) return { error: 'FriendshipId é obrigatório' };
      const result = await this.friendshipsService.respond(
        data.friendshipId,
        client.userId,
        data.accept,
      );

      if (data.accept && result && 'requester' in result) {
        this.server.to(`user:${result.requesterId}`).emit('friend:accepted', {
          friendshipId: result.id,
          user: result.receiver,
        });
      }

      return { success: true, result };
    } catch (err: any) {
      return { error: err?.message || 'Erro ao responder pedido de amizade' };
    }
  }

  @SubscribeMessage('friend:remove')
  async onFriendRemove(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { friendshipId: string },
  ) {
    try {
      if (!data?.friendshipId) return { error: 'FriendshipId é obrigatório' };
      const friendship = await this.prisma.friendship.findUnique({
        where: { id: data.friendshipId },
      });

      await this.friendshipsService.remove(data.friendshipId, client.userId);

      if (friendship) {
        const otherId =
          friendship.requesterId === client.userId
            ? friendship.receiverId
            : friendship.requesterId;

        this.server.to(`user:${otherId}`).emit('friend:removed', {
          friendshipId: data.friendshipId,
          removedBy: client.userId,
        });
      }

      return { success: true };
    } catch (err: any) {
      return { error: err?.message || 'Erro ao remover amizade' };
    }
  }

  // =====================================================================
  // MENSAGENS DIRETAS (DM) — tempo real
  // =====================================================================

  @SubscribeMessage('dm:send')
  async onDmSend(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    if (!data?.conversationId) return { error: 'ConversationId é obrigatório' };
    if (!data?.content?.trim()) return { error: 'Mensagem vazia' };
    if (data.content.length > 2000) return { error: 'Mensagem muito longa' };

    try {
      const message = await this.dmsService.sendMessage(
        data.conversationId,
        client.userId,
        data.content.trim(),
      );

      const otherUserId = await this.dmsService.getOtherParticipant(
        data.conversationId,
        client.userId,
      );

      if (otherUserId) {
        this.server.to(`user:${otherUserId}`).emit('dm:new', {
          conversationId: data.conversationId,
          message,
        });
      }

      client.emit('dm:new', {
        conversationId: data.conversationId,
        message,
      });

      return { success: true, message };
    } catch (err: any) {
      return { error: err?.message || 'Erro ao enviar mensagem direta' };
    }
  }

  @SubscribeMessage('dm:typing:start')
  async onDmTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) return;
    const otherUserId = await this.dmsService.getOtherParticipant(
      data.conversationId,
      client.userId,
    );
    if (otherUserId) {
      this.server.to(`user:${otherUserId}`).emit('dm:typing:update', {
        conversationId: data.conversationId,
        userId: client.userId,
        username: client.username,
        typing: true,
      });
    }
  }

  @SubscribeMessage('dm:typing:stop')
  async onDmTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) return;
    const otherUserId = await this.dmsService.getOtherParticipant(
      data.conversationId,
      client.userId,
    );
    if (otherUserId) {
      this.server.to(`user:${otherUserId}`).emit('dm:typing:update', {
        conversationId: data.conversationId,
        userId: client.userId,
        username: client.username,
        typing: false,
      });
    }
  }
}
