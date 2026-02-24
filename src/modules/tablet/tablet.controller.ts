import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { TabletService } from './tablet.service';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import type { TenantContext } from '../../common/tenant/tenant.types';

@ApiTags('tablet')
@Controller('tablet')
@UseGuards(TenantRequiredGuard)
export class TabletController {
  constructor(private readonly tablet: TabletService) {}

  @Post('activity')
  @ApiBody({ schema: { example: { tabletId: 'tab_1', sessionId: 'sess_1', activityType: 'menu_view' } } })
  async activity(@CurrentTenant() tenant: TenantContext, @Body() body: { tabletId: string; sessionId?: string; activityType?: string }) {
    const result = await this.tablet.touchSession({ tenantId: tenant.id, tabletId: body.tabletId.trim() });
    return {
      sessionId: result.session.sessionId,
      tabletId: result.session.tabletId,
      questionCount: Number(result.session.questionCount || 0),
      remainingQuestions: result.remainingQuestions,
      orderStatus: result.session.orderStatus,
      warningSent: result.session.warningSent,
      showPreTimeoutWarning: result.showPreTimeoutWarning,
      sessionReset: result.sessionReset,
      clearCart: result.clearCart,
      locked: result.locked,
    };
  }//

  @Post('order-status')
  @ApiBody({ schema: { example: { tabletId: 'tab_1', sessionId: 'sess_1', orderStatus: 'submitted' } } })
  async orderStatus(@CurrentTenant() tenant: TenantContext, @Body() body: { tabletId: string; sessionId?: string; orderStatus: string }) {
    const status = this.tablet.normalizeOrderStatus(body.orderStatus);
    if (!status) throw new BadRequestException('invalid_order_status');

    const result = await this.tablet.touchSession({
      tenantId: tenant.id,
      tabletId: body.tabletId.trim(),
      orderStatusOverride: status,
    });

    return {
      sessionId: result.session.sessionId,
      tabletId: result.session.tabletId,
      questionCount: Number(result.session.questionCount || 0),
      remainingQuestions: result.remainingQuestions,
      orderStatus: result.session.orderStatus,
      warningSent: result.session.warningSent,
      showPreTimeoutWarning: result.showPreTimeoutWarning,
      sessionReset: result.sessionReset,
      clearCart: result.clearCart,
      locked: result.locked,
    };
  }
}
