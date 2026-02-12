import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested, IsEnum } from 'class-validator';

export class CartMenuItemDto {
  @ApiProperty({ example: '7c44f4ef-404f-42dd-963b-52c2d87099f6' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 'Whole Wing' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Crispy deep-fried whole chicken wing with your choice of sauce.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2.35 })
  @IsNumber()
  price!: number;

  @ApiProperty({ example: 'a-la-carte' })
  @IsString()
  category!: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=800&q=80' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: [] })
  @IsOptional()
  @IsArray()
  dietary?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  popular?: boolean;

  @ApiPropertyOptional({ example: [] })
  @IsOptional()
  @IsArray()
  variations?: any[];

  @ApiPropertyOptional({ example: [] })
  @IsOptional()
  @IsArray()
  optionGroups?: any[];

  @ApiPropertyOptional({ example: [] })
  @IsOptional()
  @IsArray()
  includes?: any[];

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CartItemDto {
  @ApiProperty({ type: CartMenuItemDto })
  @ValidateNested()
  @Type(() => CartMenuItemDto)
  menuItem!: CartMenuItemDto;

  @ApiProperty({ example: 1 })
  @IsNumber()
  quantity!: number;
}

export class CartCreateDto {
  @ApiPropertyOptional({ example: 'user_123' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiProperty({ type: [CartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];

  @ApiProperty({ example: 30.5 })
  @IsNumber()
  amount!: number;

  @ApiProperty({ example: 'pickup', enum: ['pickup', 'delivery', 'tablet'] })
  @IsString()
  @IsEnum(['pickup', 'delivery', 'tablet'])
  fulfillment!: 'pickup' | 'delivery' | 'tablet';

  @ApiPropertyOptional({ example: 'web', enum: ['web', 'phone', 'tablet', 'ai'] })
  @IsOptional()
  @IsString()
  @IsEnum(['web', 'phone', 'tablet', 'ai'])
  channel?: 'web' | 'phone' | 'tablet' | 'ai';

  @ApiPropertyOptional({ example: 'Chris Brown' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: '+1-415-555-0199' })
  @IsOptional()
  @IsString()
  customerPhone?: string;
}
