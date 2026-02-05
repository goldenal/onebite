import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GroupOrdersService } from './group-orders.service';
import { CreateGroupOrderDto } from './dto/create-group-order.dto';
import { AddGroupItemDto } from './dto/add-group-item.dto';
import { UpdateGroupStatusDto } from './dto/update-group-status.dto';
import { AuthGuard, AdminGuard } from '../auth/auth.guard';

@ApiTags('group-orders')
@Controller('group-orders')
export class GroupOrdersController {
  constructor(private readonly groupOrders: GroupOrdersService) {}

  @Get()
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async listAdmin() {
    return this.groupOrders.listAdmin();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.groupOrders.get(id);
  }

  @Post()
  async create(@Body() body: CreateGroupOrderDto) {
    return this.groupOrders.create(body);
  }

  @Post(':id/items')
  async addItem(@Param('id') id: string, @Body() body: AddGroupItemDto) {
    return this.groupOrders.addItem(id, body);
  }

  @Delete(':id/items/:itemId')
  async removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.groupOrders.removeItem(id, itemId);
  }

  @Put(':id/status')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async updateStatus(@Param('id') id: string, @Body() body: UpdateGroupStatusDto) {
    return this.groupOrders.updateStatus(id, body);
  }

  @Get(':id/participant/:participantName')
  async participantItems(@Param('id') id: string, @Param('participantName') participantName: string) {
    return this.groupOrders.participantItems(id, participantName);
  }
}
