import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Implementação in-memory que substitui o Redis quando ele não está disponível.
// Mantém a mesma interface pública que a versão com ioredis.
@Injectable()
export class RedisService implements OnModuleDestroy {
  // Simula os comandos SET/GET/SADD/SREM/DEL do Redis em memória
  private store = new Map<string, string>();
  private sets = new Map<string, Set<string>>();

  constructor(private config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    console.log(
      `⚠️  RedisService rodando em modo in-memory (REDIS_URL: ${redisUrl || 'não configurado'})`,
    );
  }

  // ---- helpers internos ----
  private getSet(key: string): Set<string> {
    if (!this.sets.has(key)) this.sets.set(key, new Set());
    return this.sets.get(key)!;
  }

  async setUserOnline(userId: string, socketId: string) {
    this.getSet(`user:${userId}:sockets`).add(socketId);
    this.store.set(`socket:${socketId}:user`, userId);
  }

  // Um usuário pode ter várias abas/dispositivos abertos (vários sockets).
  // Só marcamos como offline quando o ÚLTIMO socket dele desconectar.
  async removeSocket(
    socketId: string,
  ): Promise<{ userId: string; stillOnline: boolean } | null> {
    const userId = this.store.get(`socket:${socketId}:user`);
    if (!userId) return null;

    this.getSet(`user:${userId}:sockets`).delete(socketId);
    this.store.delete(`socket:${socketId}:user`);

    const remaining = this.getSet(`user:${userId}:sockets`).size;
    return { userId, stillOnline: remaining > 0 };
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return this.getSet(`user:${userId}:sockets`).size > 0;
  }

  // -------- Presença em canais de voz --------

  async joinVoiceChannel(channelId: string, userId: string, socketId: string) {
    await this.leaveVoiceChannelBySocket(socketId);
    this.getSet(`voice:channel:${channelId}:members`).add(userId);
    this.store.set(
      `voice:socket:${socketId}`,
      JSON.stringify({ channelId, userId }),
    );
  }

  async leaveVoiceChannelBySocket(
    socketId: string,
  ): Promise<{ channelId: string; userId: string } | null> {
    const raw = this.store.get(`voice:socket:${socketId}`);
    if (!raw) return null;

    const { channelId, userId } = JSON.parse(raw);
    this.getSet(`voice:channel:${channelId}:members`).delete(userId);
    this.store.delete(`voice:socket:${socketId}`);
    return { channelId, userId };
  }

  async getVoiceChannelMembers(channelId: string): Promise<string[]> {
    return Array.from(this.getSet(`voice:channel:${channelId}:members`));
  }

  async onModuleDestroy() {
    this.store.clear();
    this.sets.clear();
  }
}
