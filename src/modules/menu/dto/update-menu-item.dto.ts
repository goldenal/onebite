import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateMenuItemDto {
  @ApiPropertyOptional({ example: 'Jerk Chicken Plate' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Grilled jerk chicken with rice and peas.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 18.5 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ example: 'entrees' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/menu/jerk.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: ['gluten-free'] })
  @IsOptional()
  @IsArray()
  dietary?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  popular?: boolean;

  @ApiPropertyOptional({ example: [{ name: 'Spice Level', options: ['Mild', 'Hot'] }] })
  @IsOptional()
  variations?: unknown;

  @ApiPropertyOptional({ example: [{ name: 'Sides', options: ['Fries', 'Salad'] }] })
  @IsOptional()
  optionGroups?: unknown;

  @ApiPropertyOptional({ example: ['Plantains'] })
  @IsOptional()
  includes?: unknown;

  @ApiPropertyOptional({ example: 'Contains nuts.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
