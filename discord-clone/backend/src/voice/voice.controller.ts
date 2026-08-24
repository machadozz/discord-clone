import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VoiceService } from './voice.service';

@Controller('channels/:channelId/voice')
@UseGuards(JwtAuthGuard)
export class VoiceController {
  constructor(private voiceService: VoiceService) {}

  // Frontend chama isso quando o usuário clica pra entrar num canal de voz.
  // Devolve o token que o frontend usa pra conectar direto no servidor LiveKit.
  @Post('token')
  getToken(@Req() req, @Param('channelId') channelId: string) {
    return this.voiceService.generateToken(
      channelId,
      req.user.userId,
      req.user.username,
    );
  }
}
