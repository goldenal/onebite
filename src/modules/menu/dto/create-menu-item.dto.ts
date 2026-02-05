import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Jerk Chicken Plate' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Grilled jerk chicken with rice and peas.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 18.5 })
  @IsNumber()
  price!: number;

  @ApiProperty({ example: 'entrees' })
  @IsString()
  category!: string;

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
