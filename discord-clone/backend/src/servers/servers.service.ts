import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServerDto, JoinServerDto } from './dto/server.dto';

@Injectable()
export class ServersService {
  constructor(private prisma: PrismaService) {}

  // Cria um servidor novo já com:
  // - role "Admin" (dono) com todas as permissões
  // - role "Membro" (padrão pra quem entra depois)
  // - canal de texto "geral" e canal de voz "Geral"
  async create(userId: string, dto: CreateServerDto) {
    const owner = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!owner) {
      throw new NotFoundException(
        'Usuário proprietário não encontrado no banco de dados.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const server = await tx.server.create({
        data: {
          name: dto.name,
          ownerId: userId,
        },
      });

      const adminRole = await tx.role.create({
        data: {
          name: 'Admin',
          color: '#f04747',
          serverId: server.id,
          canManageChannels: true,
          canManageRoles: true,
          canKickMembers: true,
          canBanMembers: true,
          canSendMessages: true,
          canDeleteMessages: true,
          canConnectVoice: true,
        },
      });

      await tx.role.create({
        data: {
          name: 'Membro',
          color: '#99AAB5',
          serverId: server.id,
        },
      });

      const member = await tx.member.create({
        data: {
          userId,
          serverId: server.id,
        },
      });

      await tx.memberRole.create({
        data: { memberId: member.id, roleId: adminRole.id },
      });

      await tx.channel.create({
        data: { name: 'geral', type: 'TEXT', serverId: server.id, position: 0 },
      });
      await tx.channel.create({
        data: {
          name: 'Geral',
          type: 'VOICE',
          serverId: server.id,
          position: 1,
        },
      });

      return this.findOne(server.id, userId, tx as unknown as PrismaService);
    });
  }

  async join(userId: string, dto: JoinServerDto) {
    const server = await this.prisma.server.findUnique({
      where: { inviteCode: dto.inviteCode },
    });
    if (!server) throw new NotFoundException('Convite inválido ou expirado');

    const existing = await this.prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId: server.id } },
    });
    if (existing) throw new ConflictException('Você já está nesse servidor');

    const isBanned = await this.prisma.serverBan.findUnique({
      where: { serverId_userId: { serverId: server.id, userId } },
    });
    if (isBanned)
      throw new ForbiddenException('Você foi banido deste servidor');

    const memberRole = await this.prisma.role.findFirst({
      where: { serverId: server.id, name: 'Membro' },
    });

    await this.prisma.member.create({
      data: {
        userId,
        serverId: server.id,
        ...(memberRole && {
          roles: { create: { roleId: memberRole.id } },
        }),
      },
    });

    return this.findOne(server.id, userId);
  }

  // Lista todos os servidores que o usuário participa
  async findMyServers(userId: string) {
    const memberships = await this.prisma.member.findMany({
      where: { userId },
      include: {
        server: {
          include: {
            channels: { orderBy: { position: 'asc' } },
            _count: { select: { members: true } },
          },
        },
      },
    });
    return memberships.map((m) => m.server);
  }

  async findOne(
    serverId: string,
    userId: string,
    client: PrismaService = this.prisma,
  ) {
    const member = await client.member.findUnique({
      where: { userId_serverId: { userId, serverId } },
    });
    if (!member)
      throw new ForbiddenException('Você não é membro desse servidor');

    return client.server.findUnique({
      where: { id: serverId },
      include: {
        channels: { orderBy: { position: 'asc' } },
        roles: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                discriminator: true,
                avatarUrl: true,
                status: true,
              },
            },
            roles: { include: { role: true } },
          },
        },
      },
    });
  }

  async leave(serverId: string, userId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });
    if (!server) throw new NotFoundException('Servidor não encontrado');
    if (server.ownerId === userId) {
      throw new ForbiddenException(
        'O dono não pode sair do servidor, apenas deletá-lo',
      );
    }
    await this.prisma.member.delete({
      where: { userId_serverId: { userId, serverId } },
    });
    return { success: true };
  }

  async delete(serverId: string, userId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });
    if (!server) throw new NotFoundException('Servidor não encontrado');
    if (server.ownerId !== userId) {
      throw new ForbiddenException('Só o dono pode deletar o servidor');
    }
    await this.prisma.server.delete({ where: { id: serverId } });
    return { success: true };
  }

  private async checkPermission(
    serverId: string,
    userId: string,
    permission: 'canKickMembers' | 'canBanMembers',
  ) {
    const member = await this.prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } },
      include: { roles: { include: { role: true } } },
    });
    if (!member) throw new ForbiddenException('Você não está no servidor');

    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });
    if (server?.ownerId === userId) return true;

    const hasPerm = member.roles.some((mr) => mr.role[permission]);
    if (!hasPerm) throw new ForbiddenException('Permissão negada');
    return true;
  }

  async kick(serverId: string, memberId: string, requesterId: string) {
    await this.checkPermission(serverId, requesterId, 'canKickMembers');

    const target = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: { server: true },
    });
    if (!target || target.serverId !== serverId)
      throw new NotFoundException('Membro não encontrado');
    if (target.server.ownerId === target.userId)
      throw new ForbiddenException('Não pode expulsar o dono');

    await this.prisma.member.delete({ where: { id: memberId } });
    return { success: true };
  }

  async ban(
    serverId: string,
    userIdToBan: string,
    requesterId: string,
    reason?: string,
  ) {
    await this.checkPermission(serverId, requesterId, 'canBanMembers');

    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });
    if (server?.ownerId === userIdToBan)
      throw new ForbiddenException('Não pode banir o dono');

    // Remove user if they are currently a member
    await this.prisma.member.deleteMany({
      where: { serverId, userId: userIdToBan },
    });

    await this.prisma.serverBan.create({
      data: { serverId, userId: userIdToBan, reason },
    });

    return { success: true };
  }
}
