import { IsOptional, IsString } from 'class-validator';

export class UpdateReservationDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  specialRequests?: string;
}
