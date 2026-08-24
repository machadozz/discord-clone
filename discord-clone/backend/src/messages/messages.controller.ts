import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { ChannelsService } from '../channels/channels.service';

@Controller('channels/:channelId/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private messagesService: MessagesService,
    private channelsService: ChannelsService,
  ) {}

  @Get()
  async findAll(
    @Req() req,
    @Param('channelId') channelId: string,
    @Query('cursor') cursor?: string,
  ) {
    // garante que o usuário tem acesso ao servidor dono desse canal
    await this.channelsService.assertMembership(channelId, req.user.userId);
    return this.messagesService.findByChannel(channelId, cursor);
  }
}
