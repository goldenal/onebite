import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LocationCreateDto {
  @ApiPropertyOptional({ example: 'loc_nj_1' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Bite Creole - Newark' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '+1-973-555-0147' })
  @IsString()
  phone!: string;

  @ApiProperty({ example: '123 Market St' })
  @IsString()
  address_line1!: string;

  @ApiPropertyOptional({ example: 'Suite 2A' })
  @IsOptional()
  @IsString()
  address_line2?: string;

  @ApiProperty({ example: 'Newark' })
  @IsString()
  city!: string;

  @ApiProperty({ example: 'NJ' })
  @IsString()
  state!: string;

  @ApiProperty({ example: '07102' })
  @IsString()
  postal_code!: string;

  @ApiProperty({ example: 'US' })
  @IsString()
  country!: string;
}
