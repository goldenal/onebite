import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { AuthGuard, AdminGuard } from '../auth/auth.guard';
import { TenantRequiredGuard } from '../../common/tenant/tenant-required.guard';
import { CurrentTenant } from '../../common/tenant/current-tenant.decorator';
import type { TenantContext } from '../../common/tenant/tenant.types';

@ApiTags('reservations')
@Controller('reservations')
@UseGuards(TenantRequiredGuard)
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Get()
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async list(@CurrentTenant() tenant: TenantContext) {
    return this.reservations.list(tenant.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async get(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.reservations.get(tenant.id, id);
  }

  @Post()
  async create(@CurrentTenant() tenant: TenantContext, @Body() body: CreateReservationDto) {
    return this.reservations.create(tenant.id, body);
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async update(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body() body: UpdateReservationDto) {
    return this.reservations.update(tenant.id, id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async remove(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.reservations.remove(tenant.id, id);
  }
}
