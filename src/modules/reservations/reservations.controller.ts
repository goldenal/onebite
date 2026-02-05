import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  @ApiBearerAuth('bearer')
  async list() {
    return this.reservations.list();
  }

  @Get(':id')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async get(@Param('id') id: string) {
    return this.reservations.get(id);
  }

  @Post()
  async create(@Body() body: CreateReservationDto) {
    return this.reservations.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async update(@Param('id') id: string, @Body() body: UpdateReservationDto) {
    return this.reservations.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard())
  @ApiBearerAuth('bearer')
  async remove(@Param('id') id: string) {
    return this.reservations.remove(id);
  }
}
