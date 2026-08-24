import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';
import { ChannelsService } from '../channels/channels.service';

@Injectable()
export class VoiceService {
  constructor(
    private config: ConfigService,
    private channelsService: ChannelsService,
  ) {}

  // Gera um token de acesso ao LiveKit para o usuário entrar numa "sala" de um servidor
  // (a sala do LiveKit é identificada pelo ID do canal de voz).
  async generateToken(channelId: string, userId: string, username: string) {
    const { channel } = await this.channelsService.assertMembership(
      channelId,
      userId,
    );

    if (channel.type !== 'VOICE') {
      throw new BadRequestException('Esse canal não é um canal de voz');
    }

    return this.createLiveKitToken(channelId, userId, username);
  }

  // Gera um token de acesso ao LiveKit para uma DM (chamada privada)
  async generateDmToken(dmId: string, userId: string, username: string) {
    // A sala será identificada pelo ID da conversa de DM
    return this.createLiveKitToken(dmId, userId, username);
  }

  private async createLiveKitToken(
    roomName: string,
    userId: string,
    username: string,
  ) {
    const apiKey = this.config.get<string>('LIVEKIT_API_KEY');
    const apiSecret = this.config.get<string>('LIVEKIT_API_SECRET');
    const url = this.config.get<string>('LIVEKIT_URL');

    if (!apiKey || !apiSecret || !url) {
      throw new BadRequestException(
        'LiveKit não está configurado no .env (LIVEKIT_API_KEY / LIVEKIT_API_SECRET / LIVEKIT_URL)',
      );
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: username,
      // token expira em 6h — tempo suficiente pra uma call longa, sem ficar eterno
      ttl: '6h',
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true, // pode enviar áudio/vídeo/tela
      canSubscribe: true, // pode receber áudio/vídeo/tela dos outros
      canPublishData: true, // usado por reações, indicadores de "falando", etc
    });

    return {
      token: await token.toJwt(),
      url,
      roomName,
    };
  }
}
