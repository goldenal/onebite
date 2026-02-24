import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import type { TenantContext } from '../../common/tenant/tenant.types';

@ApiTags('chat')
@Controller('chat')
@UseGuards(TenantRequiredGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  @ApiBody({ schema: { example: { message: "What are today's specials?", sessionId: 'sess_1', tabletId: 'tab_1' } } })
  async chats(@CurrentTenant() tenant: TenantContext, @Body() body: { message: string; sessionId?: string; tabletId?: string }) {
    return this.chat.handleChat(tenant.id, body);
  }

  @Post('reset')
  @ApiBody({ schema: { example: { tabletId: 'tab_1' } } })
  async reset(@CurrentTenant() tenant: TenantContext, @Body() body: { tabletId?: string }) {
    return this.chat.reset(tenant.id, body.tabletId);
  }
}
