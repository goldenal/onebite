import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateLegacyOrderDto {
  @ApiPropertyOptional({ example: 'fulfilled' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Pat Smith' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: '+1-415-555-0199' })
  @IsOptional()
  @IsString()
  customerPhone?: string;
}
