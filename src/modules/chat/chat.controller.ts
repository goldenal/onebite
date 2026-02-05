import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  async chats(@Body() body: { message: string; sessionId?: string; tabletId?: string }) {
    return this.chat.handleChat(body);
  }

  @Post('reset')
  async reset(@Body() body: { tabletId?: string }) {
    return this.chat.reset(body.tabletId);
  }
}
