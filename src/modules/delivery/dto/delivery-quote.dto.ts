import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

export class StructuredAddressDto {
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

export class DeliveryQuoteDto {
  @ApiPropertyOptional({ example: 'ord_12345', description: 'Optional. Provide after cart/order creation to persist quote.' })
  @IsOptional()
  @IsString()
  order_id?: string;

  @ApiProperty({ example: 'loc_nj_1' })
  @IsString()
  location_id!: string;

  @ApiPropertyOptional({ example: 'uber_direct' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ example: 'Chris Brown' })
  @IsOptional()
  @IsString()
  dropoff_name?: string;

  @ApiPropertyOptional({ example: '+1-415-555-0199' })
  @IsOptional()
  @IsString()
  dropoff_phone?: string;

  @ApiPropertyOptional({ example: 'Leave at front desk' })
  @IsOptional()
  @IsString()
  dropoff_instructions?: string;

  @ApiProperty({ type: StructuredAddressDto })
  @ValidateNested()
  @Type(() => StructuredAddressDto)
  dropoff_address!: StructuredAddressDto;
}
