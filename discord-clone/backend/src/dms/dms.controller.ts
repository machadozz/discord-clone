import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DmsService } from './dms.service';
import { VoiceService } from '../voice/voice.service';
import { CreateDmDto } from './dto/dm.dto';

@Controller('dms')
@UseGuards(JwtAuthGuard)
export class DmsController {
  constructor(
    private dmsService: DmsService,
    private voiceService: VoiceService,
  ) {}

  // Criar ou buscar conversa com outro usuário
  @Post()
  findOrCreate(@Req() req, @Body() dto: CreateDmDto) {
    return this.dmsService.findOrCreateConversation(
      req.user.userId,
      dto.userId,
    );
  }

  // Listar todas as conversas do usuário
  @Get()
  listConversations(@Req() req) {
    return this.dmsService.listConversations(req.user.userId);
  }

  // Histórico paginado de uma conversa
  @Get(':conversationId/messages')
  getMessages(
    @Req() req,
    @Param('conversationId') conversationId: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.dmsService.getMessages(conversationId, req.user.userId, cursor);
  }

  // Enviar mensagem direta via REST
  @Post(':conversationId/messages')
  sendMessage(
    @Req() req,
    @Param('conversationId') conversationId: string,
    @Body('content') content: string,
  ) {
    return this.dmsService.sendMessage(
      conversationId,
      req.user.userId,
      content,
    );
  }

  // Obter token para chamada de voz/vídeo na DM
  @Post(':conversationId/voice/token')
  async getVoiceToken(
    @Req() req,
    @Param('conversationId') conversationId: string,
  ) {
    // getMessages já valida se o usuário pertence à conversa, mas vamos checar de novo aqui garantindo segurança
    // O getOtherParticipant já valida implicitamente que a conversa existe e nós estamos nela
    const otherParticipant = await this.dmsService.getOtherParticipant(
      conversationId,
      req.user.userId,
    );
    if (!otherParticipant) {
      throw new ForbiddenException('Você não faz parte dessa conversa');
    }

    return this.voiceService.generateDmToken(
      conversationId,
      req.user.userId,
      req.user.username,
    );
  }
}
