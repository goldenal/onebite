import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { AuthGuard, AdminGuard } from '../auth/auth.guard';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menu: MenuService) {}

  @Get()
  async list() {
    return this.menu.listMenu();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const item = await this.menu.getMenuItem(id);
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard())
  async create(@Body() body: CreateMenuItemDto) {
    return this.menu.createMenuItem(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard())
  async update(@Param('id') id: string, @Body() body: UpdateMenuItemDto) {
    return this.menu.updateMenuItem(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard())
  async remove(@Param('id') id: string) {
    return this.menu.deleteMenuItem(id);
  }
}
