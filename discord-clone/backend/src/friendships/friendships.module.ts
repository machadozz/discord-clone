import { Module } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { FriendshipsController } from './friendships.controller';

@Module({
  providers: [FriendshipsService],
  controllers: [FriendshipsController],
  exports: [FriendshipsService], // o ChatGateway e DmsModule vão precisar
})
export class FriendshipsModule {}
