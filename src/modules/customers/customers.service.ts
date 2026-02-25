import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService, type AuthPayload } from '../auth/auth.service';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  private toAccountResponse(account: any) {
    return {
      id: account.id,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      phone: account.phone,
      createdAt: account.createdAt?.toISOString?.() || null,
      updatedAt: account.updatedAt?.toISOString?.() || null,
    };
  }

  private signCustomerToken(account: any, tenantId: string) {
    return this.auth.signToken({
      sub: account.id,
      role: 'customer',
      tenantId,
      email: account.email,
    });
  }

  async register(tenantId: string, dto: RegisterCustomerDto) {
    const email = dto.email.toLowerCase().trim();
    const hash = await bcrypt.hash(dto.password, 10);

    const account = await this.prisma.customerAccount.upsert({
      where: { tenantId_email: { tenantId, email } },
      update: {
        passwordHash: hash,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
        phone: dto.phone ?? null,
        updatedAt: new Date(),
      },
      create: {
        id: `cust_${randomUUID()}`,
        tenantId,
        email,
        passwordHash: hash,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
        phone: dto.phone ?? null,
      },
    });

    const token = this.signCustomerToken(account, tenantId);
    return { success: true, token, customer: this.toAccountResponse(account) };
  }

  async login(tenantId: string, dto: CustomerLoginDto) {
    const email = dto.email.toLowerCase().trim();
    const account = await this.prisma.customerAccount.findUnique({ where: { tenantId_email: { tenantId, email } } });
    if (!account) throw new UnauthorizedException('invalid_credentials');

    const ok = await bcrypt.compare(dto.password, account.passwordHash);
    if (!ok) throw new UnauthorizedException('invalid_credentials');

    const token = this.signCustomerToken(account, tenantId);
    return { success: true, token, customer: this.toAccountResponse(account) };
  }

  async me(tenantId: string, auth: AuthPayload) {
    const account = await this.prisma.customerAccount.findFirst({ where: { id: auth.sub, tenantId } });
    if (!account) throw new NotFoundException('customer_not_found');
    return this.toAccountResponse(account);
  }

  async myOrders(tenantId: string, auth: AuthPayload) {
    const links = await this.prisma.paymentLink.findMany({
      where: { tenantId, userId: auth.sub },
      orderBy: { createdAt: 'desc' },
    });

    const orderIds = links.map((link) => link.orderId);
    const orders = orderIds.length
      ? await this.prisma.order.findMany({ where: { tenantId, id: { in: orderIds } } })
      : [];
    const ordersById = new Map(orders.map((order) => [order.id, order]));

    return links.map((link) => {
      const order = ordersById.get(link.orderId);
      return {
        orderId: link.orderId,
        paymentState: link.state,
        amount: Number(link.amount || 0),
        status: order?.status || null,
        fulfillment: order?.fulfillment || link.fulfillment || null,
        createdAt: link.createdAt?.toISOString?.() || null,
        updatedAt: link.updatedAt?.toISOString?.() || null,
      };
    });
  }

  async myOrderById(tenantId: string, auth: AuthPayload, orderId: string) {
    const link = await this.prisma.paymentLink.findFirst({ where: { orderId, tenantId, userId: auth.sub } });
    if (!link) throw new NotFoundException('order_not_found');

    const order = await this.prisma.order.findFirst({ where: { tenantId, id: orderId } });
    return {
      orderId,
      paymentState: link.state,
      amount: Number(link.amount || 0),
      fulfillment: order?.fulfillment || link.fulfillment || null,
      status: order?.status || null,
      arrivalStatus: order?.arrivalStatus || null,
      paidAt: order?.paidAt?.toISOString?.() || null,
      createdAt: order?.createdAt?.toISOString?.() || link.createdAt?.toISOString?.() || null,
      updatedAt: link.updatedAt?.toISOString?.() || null,
    };
  }
}
