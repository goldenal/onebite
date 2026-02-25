import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LocationCreateDto } from './dto/location-create.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: LocationCreateDto) {
    const id = dto.id || `loc_${randomUUID()}`;
    const existing = await this.prisma.location.findFirst({ where: { id, tenantId } });
    const location = existing
      ? await this.prisma.location.update({
          where: { id },
          data: {
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
        })
      : await this.prisma.location.create({
          data: {
            id,
            tenantId,
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
    if (location.tenantId !== tenantId) {
      throw new NotFoundException('location_not_found');
    }
    return location;
  }

  async list(tenantId: string) {
    return this.prisma.location.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
  }

  async get(tenantId: string, id: string) {
    const location = await this.prisma.location.findFirst({ where: { id, tenantId } });
    if (!location) throw new NotFoundException('location_not_found');
    return location;
  }

  async getDefault(tenantId: string) {
    return this.prisma.location.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
