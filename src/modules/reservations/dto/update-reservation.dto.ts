import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateReservationDto {
  @ApiPropertyOptional({ example: 'confirmed' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Customer requested later time.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Window seat if available.' })
  @IsOptional()
  @IsString()
  specialRequests?: string;
}
