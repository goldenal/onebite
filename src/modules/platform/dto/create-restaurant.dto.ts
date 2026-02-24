import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested, IsEmail, MinLength } from 'class-validator';

export class CreateRestaurantLocationDto {
  @ApiPropertyOptional({ example: 'loc_123' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Main Location' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '+1-415-555-0199' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  @IsNotEmpty()
  address_line1!: string;

  @ApiPropertyOptional({ example: 'Suite 200' })
  @IsOptional()
  @IsString()
  address_line2?: string;

  @ApiProperty({ example: 'San Francisco' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 'CA' })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({ example: '94103' })
  @IsString()
  @IsNotEmpty()
  postal_code!: string;

  @ApiProperty({ example: 'US' })
  @IsString()
  @IsNotEmpty()
  country!: string;
}

export class CreateRestaurantDto {
  @ApiProperty({ example: 'bitter' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiProperty({ example: 'Bitter Restaurant' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ enum: ['active', 'suspended'], example: 'active' })
  @IsOptional()
  @IsEnum(['active', 'suspended'])
  status?: 'active' | 'suspended';

  @ApiPropertyOptional({ example: 'bitter.example.com' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ example: 'owner@bitter.com' })
  @IsOptional()
  @IsEmail()
  owner_email?: string;

  @ApiPropertyOptional({ example: 'owner@bitter.com' })
  @IsOptional()
  @IsEmail()
  ownerEmail?: string;

  @ApiPropertyOptional({ example: 'StrongPassword123!' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  owner_password?: string;

  @ApiPropertyOptional({ example: 'StrongPassword123!' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  ownerPassword?: string;

  @ApiPropertyOptional({ example: 'Bitter Owner' })
  @IsOptional()
  @IsString()
  owner_name?: string;

  @ApiPropertyOptional({ example: 'Bitter Owner' })
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiProperty({ type: CreateRestaurantLocationDto })
  @ValidateNested()
  @Type(() => CreateRestaurantLocationDto)
  location!: CreateRestaurantLocationDto;
}
