import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CustomersService } from './customers.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import type { TenantContext } from '../../common/tenant/tenant.types';
import { AuthGuard, CustomerGuard } from '../auth/auth.guard';

@ApiTags('customers')
@Controller('customers')
@UseGuards(TenantRequiredGuard)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post('register')
  async register(@CurrentTenant() tenant: TenantContext, @Body() body: RegisterCustomerDto) {
    return this.customers.register(tenant.id, body);
  }

  @Post('login')
  async login(@CurrentTenant() tenant: TenantContext, @Body() body: CustomerLoginDto) {
    return this.customers.login(tenant.id, body);
  }

  @Post('logout')
  async logout() {
    return { success: true, message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(AuthGuard, CustomerGuard())
  @ApiBearerAuth('bearer')
  async me(@Req() req: Request, @CurrentTenant() tenant: TenantContext) {
    return this.customers.me(tenant.id, (req as any).user);
  }

  @Get('orders')
  @UseGuards(AuthGuard, CustomerGuard())
  @ApiBearerAuth('bearer')
  async myOrders(@Req() req: Request, @CurrentTenant() tenant: TenantContext) {
    return this.customers.myOrders(tenant.id, (req as any).user);
  }

  @Get('orders/:orderId')
  @UseGuards(AuthGuard, CustomerGuard())
  @ApiBearerAuth('bearer')
  async myOrderById(@Req() req: Request, @CurrentTenant() tenant: TenantContext, @Param('orderId') orderId: string) {
    return this.customers.myOrderById(tenant.id, (req as any).user, orderId);
  }
}
