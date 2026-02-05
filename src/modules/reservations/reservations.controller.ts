import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { AuthGuard, AdminGuard } from '../auth/auth.guard';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Get()
  @UseGuards(AuthGuard, AdminGuard())
  async list() {
    return this.reservations.list();
  }

  @Get(':id')
  @UseGuards(AuthGuard, AdminGuard())
  async get(@Param('id') id: string) {
    return this.reservations.get(id);
  }

  @Post()
  async create(@Body() body: CreateReservationDto) {
    return this.reservations.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard())
  async update(@Param('id') id: string, @Body() body: UpdateReservationDto) {
    return this.reservations.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard())
  async remove(@Param('id') id: string) {
    return this.reservations.remove(id);
  }
}
