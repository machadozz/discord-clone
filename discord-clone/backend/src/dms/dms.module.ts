import { Module } from '@nestjs/common';
import { DmsService } from './dms.service';
import { DmsController } from './dms.controller';
import { FriendshipsModule } from '../friendships/friendships.module';
import { VoiceModule } from '../voice/voice.module';

@Module({
  imports: [FriendshipsModule, VoiceModule], // precisa do FriendshipsService pra validar amizade/bloqueio
  providers: [DmsService],
  controllers: [DmsController],
  exports: [DmsService], // o ChatGateway vai precisar
})
export class DmsModule {}
