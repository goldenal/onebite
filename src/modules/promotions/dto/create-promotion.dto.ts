import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePromotionDto {
  @ApiProperty({ example: 'Lunch Special' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '10% off entrees from 11am-2pm' })
  @IsString()
  description!: string;

  @ApiProperty({ example: 'percentage' })
  @IsString()
  type!: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  value!: number;

  @ApiPropertyOptional({ example: ['menu_1', 'menu_2'] })
  @IsOptional()
  applicableItems?: unknown;

  @ApiPropertyOptional({ example: ['entrees', 'lunch'] })
  @IsOptional()
  applicableCategories?: unknown;

  @ApiPropertyOptional({ example: '2026-02-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: 'LUNCH10' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  minimumPurchase?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  maxUses?: number;

  @ApiPropertyOptional({ example: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] })
  @IsOptional()
  daysOfWeek?: unknown;

  @ApiPropertyOptional({ example: '11:00' })
  @IsOptional()
  @IsString()
  timeStart?: string;

  @ApiPropertyOptional({ example: '14:00' })
  @IsOptional()
  @IsString()
  timeEnd?: string;
}
