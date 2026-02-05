import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePromotionDto {
  @ApiPropertyOptional({ example: 'Lunch Special' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '10% off entrees from 11am-2pm' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'percentage' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  value?: number;

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

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  currentUses?: number;

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
