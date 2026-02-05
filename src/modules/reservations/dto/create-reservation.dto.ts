import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ example: 'Sam Taylor' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'sam@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+1-415-555-0123' })
  @IsString()
  phone!: string;

  @ApiProperty({ example: '4' })
  @IsString()
  guests!: string;

  @ApiProperty({ example: '2026-02-14' })
  @IsString()
  date!: string;

  @ApiProperty({ example: '19:30' })
  @IsString()
  time!: string;

  @ApiPropertyOptional({ example: 'Window seat if available.' })
  @IsOptional()
  @IsString()
  specialRequests?: string;
}
