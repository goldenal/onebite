import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LocationCreateDto } from './dto/location-create.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: LocationCreateDto) {
    const id = dto.id || `loc_${randomUUID()}`;
    const location = await this.prisma.location.upsert({
      where: { id },
      update: {
        name: dto.name,
        phone: dto.phone,
        addressLine1: dto.address_line1,
        addressLine2: dto.address_line2 ?? null,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postal_code,
        country: dto.country,
        updatedAt: new Date(),
      },
      create: {
        id,
        name: dto.name,
        phone: dto.phone,
        addressLine1: dto.address_line1,
        addressLine2: dto.address_line2 ?? null,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postal_code,
        country: dto.country,
      },
    });
    return location;
  }

  async list() {
    return this.prisma.location.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async get(id: string) {
    const location = await this.prisma.location.findUnique({ where: { id } });
    if (!location) throw new NotFoundException('location_not_found');
    return location;
  }
}
