import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { LocationCreateDto } from './dto/location-create.dto';

@ApiTags('locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Post()
  async create(@Body() body: LocationCreateDto) {
    return this.locations.create(body);
  }

  @Get()
  async list() {
    return this.locations.list();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.locations.get(id);
  }
}
