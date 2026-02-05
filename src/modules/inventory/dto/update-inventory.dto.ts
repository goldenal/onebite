import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateInventoryDto {
  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  currentStock?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  minStock?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  maxStock?: number;

  @ApiPropertyOptional({ example: 'plates' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  autoReorder?: boolean;
}
