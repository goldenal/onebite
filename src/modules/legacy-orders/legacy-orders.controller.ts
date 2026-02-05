import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LegacyOrdersService } from './legacy-orders.service';
import { CreateLegacyOrderDto } from './dto/create-legacy-order.dto';
import { UpdateLegacyOrderDto } from './dto/update-legacy-order.dto';
import { AuthGuard, AdminGuard } from '../auth/auth.guard';

@ApiTags('legacy-orders')
@Controller('orders')
export class LegacyOrdersController {
  constructor(private readonly orders: LegacyOrdersService) {}

  @Get()
  @UseGuards(AuthGuard, AdminGuard())
  async list() {
    return this.orders.list();
  }

  @Get(':id')
  @UseGuards(AuthGuard, AdminGuard())
  async get(@Param('id') id: string) {
    return this.orders.get(id);
  }

  @Post()
  async create(@Body() body: CreateLegacyOrderDto) {
    return this.orders.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard())
  async update(@Param('id') id: string, @Body() body: UpdateLegacyOrderDto) {
    return this.orders.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard())
  async remove(@Param('id') id: string) {
    return this.orders.remove(id);
  }
}
