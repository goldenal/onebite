import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.reservation.findMany({
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      guests: r.guests,
      date: r.date,
      time: r.time,
      specialRequests: r.specialRequests,
      status: r.status,
      notes: r.notes,
      createdAt: Number(r.createdAt),
    }));
  }

  async get(id: string) {
    const r = await this.prisma.reservation.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Reservation not found');
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      guests: r.guests,
      date: r.date,
      time: r.time,
      specialRequests: r.specialRequests,
      status: r.status,
      notes: r.notes,
      createdAt: Number(r.createdAt),
    };
  }

  async create(dto: CreateReservationDto) {
    const id = randomUUID();
    const createdAt = BigInt(Date.now());
    await this.prisma.reservation.create({
      data: {
        id,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        guests: dto.guests,
        date: dto.date,
        time: dto.time,
        specialRequests: dto.specialRequests ?? '',
        status: 'pending',
        createdAt,
      },
    });
    return { id, ...dto, status: 'pending', createdAt: Number(createdAt) };
  }

  async update(id: string, dto: UpdateReservationDto) {
    const existing = await this.prisma.reservation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Reservation not found');

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: dto.status ?? existing.status,
        notes: dto.notes ?? existing.notes,
        specialRequests: dto.specialRequests ?? existing.specialRequests,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      guests: updated.guests,
      date: updated.date,
      time: updated.time,
      specialRequests: updated.specialRequests,
      status: updated.status,
      notes: updated.notes,
      createdAt: Number(updated.createdAt),
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.reservation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Reservation not found');
    await this.prisma.reservation.delete({ where: { id } });
    return { message: 'Reservation deleted successfully' };
  }
}
