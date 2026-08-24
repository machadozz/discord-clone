import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  // Histórico paginado (cursor-based, mais eficiente que offset pra chat)
  async findByChannel(channelId: string, cursor?: string, take = 50) {
    const messages = await this.prisma.message.findMany({
      where: { channelId },
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true,
          },
        },
        member: { select: { nickname: true } },
      },
    });
    return messages.reverse(); // devolve em ordem cronológica
  }

  async create(
    channelId: string,
    authorId: string,
    memberId: string | null,
    content: string,
  ) {
    return this.prisma.message.create({
      data: { channelId, authorId, memberId, content },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            discriminator: true,
            avatarUrl: true,
          },
        },
        member: { select: { nickname: true } },
      },
    });
  }
}
