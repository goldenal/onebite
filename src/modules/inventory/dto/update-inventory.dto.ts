import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateInventoryDto {
  @IsOptional()
  @IsNumber()
  currentStock?: number;

  @IsOptional()
  @IsNumber()
  minStock?: number;

  @IsOptional()
  @IsNumber()
  maxStock?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  autoReorder?: boolean;
}
