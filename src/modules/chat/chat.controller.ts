import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  @ApiBody({ schema: { example: { message: "What are today's specials?", sessionId: 'sess_1', tabletId: 'tab_1' } } })
  async chats(@Body() body: { message: string; sessionId?: string; tabletId?: string }) {
    return this.chat.handleChat(body);
  }

  @Post('reset')
  @ApiBody({ schema: { example: { tabletId: 'tab_1' } } })
  async reset(@Body() body: { tabletId?: string }) {
    return this.chat.reset(body.tabletId);
  }
}
