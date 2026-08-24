import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendshipsService } from '../friendships/friendships.service';

@Injectable()
export class DmsService {
  constructor(
    private prisma: PrismaService,
    private friendships: FriendshipsService,
  ) {}

  // Busca conversa existente entre dois usuários ou cria uma nova.
  // Valida que são amigos e ninguém está bloqueado.
  async findOrCreateConversation(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new ForbiddenException(
        'Você não pode criar uma conversa consigo mesmo',
      );
    }

    // Verifica bloqueio
    const blocked = await this.friendships.isBlocked(userId, targetUserId);
    if (blocked) {
      throw new ForbiddenException('Não foi possível criar a conversa');
    }

    // Verifica amizade
    const friends = await this.friendships.areFriends(userId, targetUserId);
    if (!friends) {
      throw new ForbiddenException(
        'Vocês precisam ser amigos para trocar mensagens diretas',
      );
    }

    // Busca conversa existente (em qualquer ordem dos IDs)
    const existing = await this.prisma.dMConversation.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: targetUserId },
          { userAId: targetUserId, userBId: userId },
        ],
      },
    });

    if (existing) {
      return this.getConversationWithDetails(existing.id, userId);
    }

    // Cria nova conversa — ordena os IDs pra evitar duplicatas
    const [userAId, userBId] = [userId, targetUserId].sort();
    const conversation = await this.prisma.dMConversation.create({
      data: { userAId, userBId },
    });

    return this.getConversationWithDetails(conversation.id, userId);
  }

  // Lista todas as conversas do usuário com a última mensagem e dados do outro participante
  async listConversations(userId: string) {
    const conversations = await this.prisma.dMConversation.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    });

    // Para cada conversa, busca o outro participante e a última mensagem
    const results = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId =
          conv.userAId === userId ? conv.userBId : conv.userAId;
        const otherUser = await this.prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true,
            status: true,
          },
        });

        const lastMessage = await this.prisma.directMessage.findFirst({
          where: { conversationId: conv.id },
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                discriminator: true,
                avatarUrl: true,
              },
            },
          },
        });

        return {
          id: conv.id,
          participant: otherUser,
          lastMessage,
          createdAt: conv.createdAt,
        };
      }),
    );

    // Ordena por última mensagem (conversas com mensagem mais recente primeiro)
    return results.sort((a, b) => {
      const dateA = a.lastMessage?.createdAt || a.createdAt;
      const dateB = b.lastMessage?.createdAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }

  // Envia mensagem direta — valida que o remetente participa da conversa
  async sendMessage(conversationId: string, senderId: string, content: string) {
    const conversation = await this.prisma.dMConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversa não encontrada');

    // Valida que o remetente faz parte da conversa
    if (
      conversation.userAId !== senderId &&
      conversation.userBId !== senderId
    ) {
      throw new ForbiddenException('Você não faz parte dessa conversa');
    }

    // Verifica bloqueio antes de enviar
    const otherUserId =
      conversation.userAId === senderId
        ? conversation.userBId
        : conversation.userAId;

    const blocked = await this.friendships.isBlocked(senderId, otherUserId);
    if (blocked) {
      throw new ForbiddenException('Não foi possível enviar a mensagem');
    }

    return this.prisma.directMessage.create({
      data: {
        conversationId,
        senderId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  // Histórico paginado cursor-based (mesmo padrão do MessagesService)
  async getMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    take = 50,
  ) {
    const conversation = await this.prisma.dMConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversa não encontrada');

    if (conversation.userAId !== userId && conversation.userBId !== userId) {
      throw new ForbiddenException('Você não faz parte dessa conversa');
    }

    const messages = await this.prisma.directMessage.findMany({
      where: { conversationId },
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true,
          },
        },
      },
    });

    return messages.reverse(); // devolve em ordem cronológica
  }

  // Retorna o ID do outro participante de uma conversa
  async getOtherParticipant(
    conversationId: string,
    senderId: string,
  ): Promise<string | null> {
    const conversation = await this.prisma.dMConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) return null;
    return conversation.userAId === senderId
      ? conversation.userBId
      : conversation.userAId;
  }

  // Detalhes de uma conversa com dados do outro participante
  private async getConversationWithDetails(
    conversationId: string,
    userId: string,
  ) {
    const conversation = await this.prisma.dMConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversa não encontrada');

    const otherUserId =
      conversation.userAId === userId
        ? conversation.userBId
        : conversation.userAId;
    const participant = await this.prisma.user.findUnique({
      where: { id: otherUserId },
      select: {
        id: true,
        username: true,
        discriminator: true,
        avatarUrl: true,
        status: true,
      },
    });

    return {
      id: conversation.id,
      participant,
      createdAt: conversation.createdAt,
    };
  }
}
