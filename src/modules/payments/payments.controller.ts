import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CartCreateDto } from './dto/cart-create.dto';
import { PaymentLinkDto } from './dto/payment-link.dto';
import { PhonePaymentLinkDto } from './dto/phone-payment-link.dto';
import { CheckoutSessionDto } from './dto/checkout-session.dto';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import type { TenantContext } from '../../common/tenant/tenant.types';
import { AuthGuard, AdminGuard } from '../auth/auth.guard';
import { PlatformService } from '../platform/platform.service';

@ApiTags('payments')
@Controller()
@UseGuards(TenantRequiredGuard)
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly platform: PlatformService,
  ) {}

  @Post('cart/create')
  async createCart(@CurrentTenant() tenant: TenantContext, @Body() body: CartCreateDto) {
    return this.payments.createCart(tenant.id, body);
  }

  @Post('payments/link')
  async paymentLink(@CurrentTenant() tenant: TenantContext, @Body() body: PaymentLinkDto) {
    return this.payments.createPaymentLink(tenant.id, body);
  }

  @Post('phone/payment-link')
  async phonePaymentLink(@CurrentTenant() tenant: TenantContext, @Body() body: PhonePaymentLinkDto) {
    return this.payments.phonePaymentLink(tenant.id, body);
  }

  @Post('payments/checkout-session')
  async createCheckoutSession(@CurrentTenant() tenant: TenantContext, @Body() body: CheckoutSessionDto) {
    return this.payments.createCheckoutSession(tenant.id, body);
  }

  @Get('payments/summary')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async paymentSummary(
    @CurrentTenant() tenant: TenantContext,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.payments.paymentSummary(tenant.id, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('payments/transactions')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async paymentTransactions(
    @CurrentTenant() tenant: TenantContext,
    @Query('state') state?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.payments.paymentTransactions(tenant.id, {
      state,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Post('payments/connect-account')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async connectAccount(@CurrentTenant() tenant: TenantContext) {
    return this.platform.createConnectAccount(tenant.id);
  }

  @Get('payments/connect-status')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async connectStatus(@CurrentTenant() tenant: TenantContext) {
    return this.platform.connectStatus(tenant.id);
  }

  @Get('payments/:orderId')
  async getPayment(@CurrentTenant() tenant: TenantContext, @Param('orderId') orderId: string) {
    return this.payments.getPayment(tenant.id, orderId);
  }
}
