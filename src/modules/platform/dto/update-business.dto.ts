import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateBusinessDto {
  @ApiPropertyOptional({ example: 'bitter' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Bitter Restaurant' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ['active', 'suspended'], example: 'active' })
  @IsOptional()
  @IsEnum(['active', 'suspended'])
  status?: 'active' | 'suspended';
}
