import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../messages/messages.module';
import { ChannelsModule } from '../channels/channels.module';
import { AuthModule } from '../auth/auth.module';
import { FriendshipsModule } from '../friendships/friendships.module';
import { DmsModule } from '../dms/dms.module';

@Module({
  imports: [
    MessagesModule,
    ChannelsModule,
    AuthModule, // AuthModule exporta o JwtModule
    FriendshipsModule,
    DmsModule,
  ],
  providers: [ChatGateway],
})
export class ChatModule {}
