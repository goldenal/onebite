import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { AuthGuard, AdminGuard } from '../auth/auth.guard';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get()
  @UseGuards(AuthGuard, AdminGuard())
  async list() {
    return this.promotions.list();
  }

  @Get('active')
  async listActive() {
    return this.promotions.listActive();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.promotions.get(id);
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard())
  async create(@Body() body: CreatePromotionDto) {
    return this.promotions.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard())
  async update(@Param('id') id: string, @Body() body: UpdatePromotionDto) {
    return this.promotions.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard())
  async remove(@Param('id') id: string) {
    return this.promotions.remove(id);
  }
}
