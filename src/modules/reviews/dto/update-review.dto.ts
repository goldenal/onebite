import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateReviewDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  approved?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @ApiPropertyOptional({ example: 'Called customer to follow up.' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
