import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { TabletService } from './tablet.service';

@ApiTags('tablet')
@Controller('tablet')
export class TabletController {
  constructor(private readonly tablet: TabletService) {}

  @Post('activity')
  @ApiBody({ schema: { example: { tabletId: 'tab_1', sessionId: 'sess_1', activityType: 'menu_view' } } })
  async activity(@Body() body: { tabletId: string; sessionId?: string; activityType?: string }) {
    const result = await this.tablet.touchSession({ tabletId: body.tabletId.trim() });
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

  @Post('order-status')
  @ApiBody({ schema: { example: { tabletId: 'tab_1', sessionId: 'sess_1', orderStatus: 'submitted' } } })
  async orderStatus(@Body() body: { tabletId: string; sessionId?: string; orderStatus: string }) {
    const status = this.tablet.normalizeOrderStatus(body.orderStatus);
    if (!status) return { error: 'invalid_order_status' };

    const result = await this.tablet.touchSession({
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
