import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto } from './dto/channel.dto';

@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService) {}

  // Verifica se o usuário é membro do servidor e tem permissão de gerenciar canais
  private async assertCanManage(serverId: string, userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } },
      include: { roles: { include: { role: true } } },
    });
    if (!member)
      throw new ForbiddenException('Você não é membro desse servidor');

    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });
    const isOwner = server?.ownerId === userId;
    const canManage = member.roles.some((r) => r.role.canManageChannels);

    if (!isOwner && !canManage) {
      throw new ForbiddenException(
        'Você não tem permissão para gerenciar canais',
      );
    }
    return member;
  }

  async create(serverId: string, userId: string, dto: CreateChannelDto) {
    await this.assertCanManage(serverId, userId);

    const lastChannel = await this.prisma.channel.findFirst({
      where: { serverId },
      orderBy: { position: 'desc' },
    });

    return this.prisma.channel.create({
      data: {
        name: dto.name,
        type: dto.type,
        serverId,
        position: (lastChannel?.position ?? -1) + 1,
      },
    });
  }

  async remove(serverId: string, channelId: string, userId: string) {
    await this.assertCanManage(serverId, userId);

    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!channel || channel.serverId !== serverId) {
      throw new NotFoundException('Canal não encontrado nesse servidor');
    }

    await this.prisma.channel.delete({ where: { id: channelId } });
    return { success: true };
  }

  // Garante que o usuário é membro do servidor dono do canal (usado antes de ler mensagens)
  async assertMembership(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!channel) throw new NotFoundException('Canal não encontrado');

    const member = await this.prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId: channel.serverId } },
    });
    if (!member)
      throw new ForbiddenException('Você não tem acesso a esse canal');

    return { channel, member };
  }
}
