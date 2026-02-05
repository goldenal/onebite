import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  applicableItems?: unknown;

  @IsOptional()
  applicableCategories?: unknown;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsNumber()
  minimumPurchase?: number;

  @IsOptional()
  @IsNumber()
  maxUses?: number;

  @IsOptional()
  @IsNumber()
  currentUses?: number;

  @IsOptional()
  daysOfWeek?: unknown;

  @IsOptional()
  @IsString()
  timeStart?: string;

  @IsOptional()
  @IsString()
  timeEnd?: string;
}
