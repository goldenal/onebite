import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { TabletModule } from '../tablet/tablet.module';

@Module({
  imports: [TabletModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
