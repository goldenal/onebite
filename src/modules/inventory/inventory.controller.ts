import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AuthGuard, AdminGuard } from '../auth/auth.guard';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  async list() {
    return this.inventory.list();
  }

  @Get(':itemId')
  async get(@Param('itemId') itemId: string) {
    return this.inventory.get(itemId);
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard())
  async create(@Body() body: CreateInventoryDto) {
    return this.inventory.create(body);
  }

  @Put(':itemId')
  @UseGuards(AuthGuard, AdminGuard())
  async update(@Param('itemId') itemId: string, @Body() body: UpdateInventoryDto) {
    return this.inventory.update(itemId, body);
  }

  @Delete(':itemId')
  @UseGuards(AuthGuard, AdminGuard())
  async remove(@Param('itemId') itemId: string) {
    return this.inventory.remove(itemId);
  }
}
