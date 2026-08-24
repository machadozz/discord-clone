import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendFriendRequestDto } from './dto/friendship.dto';

@Injectable()
export class FriendshipsService {
  constructor(private prisma: PrismaService) {}

  // Envia pedido de amizade usando a tag (username#discriminator)
  async sendRequest(requesterId: string, dto: SendFriendRequestDto) {
    let target = null;
    if (dto.discriminator && dto.discriminator !== '0000') {
      target = await this.prisma.user.findUnique({
        where: {
          username_discriminator: {
            username: dto.username,
            discriminator: dto.discriminator,
          },
        },
      });
    }

    if (!target) {
      target = await this.prisma.user.findFirst({
        where: {
          username: { equals: dto.username },
        },
      });
    }

    if (!target) {
      throw new NotFoundException(
        `Usuário "${dto.username}" não foi encontrado. Verifique o nome e tente novamente.`,
      );
    }

    if (target.id === requesterId) {
      throw new BadRequestException(
        'Você não pode enviar pedido de amizade para si mesmo',
      );
    }

    // Checa se já existe alguma relação entre os dois (em qualquer direção)
    const existing = await this.findExistingRelation(requesterId, target.id);

    if (existing) {
      if (existing.status === 'BLOCKED') {
        throw new ForbiddenException('Não foi possível enviar o pedido');
      }
      if (existing.status === 'ACCEPTED') {
        throw new ConflictException('Vocês já são amigos');
      }
      if (existing.status === 'PENDING') {
        // Se o outro já mandou pedido pra mim, aceita automaticamente
        if (existing.receiverId === requesterId) {
          return this.respond(existing.id, requesterId, true);
        }
        throw new ConflictException('Pedido de amizade já enviado');
      }
    }

    const friendship = await this.prisma.friendship.create({
      data: {
        requesterId,
        receiverId: target.id,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true,
          },
        },
      },
    });

    return friendship;
  }

  // Aceitar ou recusar pedido pendente
  async respond(friendshipId: string, userId: string, accept: boolean) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) throw new NotFoundException('Pedido não encontrado');
    if (friendship.receiverId !== userId) {
      throw new ForbiddenException(
        'Só o destinatário pode responder ao pedido',
      );
    }
    if (friendship.status !== 'PENDING') {
      throw new ConflictException('Esse pedido já foi respondido');
    }

    if (accept) {
      return this.prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: 'ACCEPTED' },
        include: {
          requester: {
            select: {
              id: true,
              username: true,
              discriminator: true,
              avatarUrl: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              discriminator: true,
              avatarUrl: true,
            },
          },
        },
      });
    } else {
      await this.prisma.friendship.delete({ where: { id: friendshipId } });
      return { success: true, message: 'Pedido recusado' };
    }
  }

  // Desfazer amizade (qualquer um dos dois pode)
  async remove(friendshipId: string, userId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
    if (!friendship) throw new NotFoundException('Amizade não encontrada');

    if (friendship.requesterId !== userId && friendship.receiverId !== userId) {
      throw new ForbiddenException('Você não faz parte dessa amizade');
    }

    await this.prisma.friendship.delete({ where: { id: friendshipId } });
    return { success: true };
  }

  // Bloquear usuário — cria nova relação BLOCKED ou atualiza existente
  async block(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('Você não pode bloquear a si mesmo');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) throw new NotFoundException('Usuário não encontrado');

    const existing = await this.findExistingRelation(userId, targetUserId);

    if (existing) {
      if (existing.status === 'BLOCKED' && existing.requesterId === userId) {
        throw new ConflictException('Usuário já está bloqueado');
      }
      // Atualiza a relação existente pra BLOCKED, com o bloqueador como requester
      await this.prisma.friendship.delete({ where: { id: existing.id } });
    }

    return this.prisma.friendship.create({
      data: {
        requesterId: userId,
        receiverId: targetUserId,
        status: 'BLOCKED',
      },
      include: {
        receiver: {
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

  // Desbloquear — só quem bloqueou pode desbloquear
  async unblock(userId: string, targetUserId: string) {
    const existing = await this.prisma.friendship.findFirst({
      where: {
        requesterId: userId,
        receiverId: targetUserId,
        status: 'BLOCKED',
      },
    });

    if (!existing) throw new NotFoundException('Bloqueio não encontrado');

    await this.prisma.friendship.delete({ where: { id: existing.id } });
    return { success: true };
  }

  // Lista amigos aceitos
  async listFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true,
            status: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
    });

    // Retorna o "outro" usuário (não eu) com o id da amizade
    return friendships.map((f) => ({
      friendshipId: f.id,
      user: f.requesterId === userId ? f.receiver : f.requester,
      since: f.createdAt,
    }));
  }

  // Lista pedidos pendentes (enviados + recebidos)
  async listPending(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'PENDING',
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true,
          },
        },
      },
    });

    return friendships.map((f) => ({
      id: f.id,
      friendshipId: f.id,
      status: f.status,
      type: f.requesterId === userId ? 'sent' : 'received',
      user: f.requesterId === userId ? f.receiver : f.requester,
      requester: f.requester,
      receiver: f.receiver,
      createdAt: f.createdAt,
    }));
  }

  // Lista usuários bloqueados por mim
  async listBlocked(userId: string) {
    const blocked = await this.prisma.friendship.findMany({
      where: {
        requesterId: userId,
        status: 'BLOCKED',
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true,
          },
        },
      },
    });

    return blocked.map((b) => ({
      friendshipId: b.id,
      user: b.receiver,
      blockedAt: b.createdAt,
    }));
  }

  // Checa se userId1 bloqueou userId2 (ou vice-versa)
  async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const block = await this.prisma.friendship.findFirst({
      where: {
        status: 'BLOCKED',
        OR: [
          { requesterId: userId1, receiverId: userId2 },
          { requesterId: userId2, receiverId: userId1 },
        ],
      },
    });
    return !!block;
  }

  // Checa se dois usuários são amigos
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: userId1, receiverId: userId2 },
          { requesterId: userId2, receiverId: userId1 },
        ],
      },
    });
    return !!friendship;
  }

  // Busca qualquer relação existente entre dois usuários (em qualquer direção)
  private async findExistingRelation(userId1: string, userId2: string) {
    return this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId1, receiverId: userId2 },
          { requesterId: userId2, receiverId: userId1 },
        ],
      },
    });
  }
}
