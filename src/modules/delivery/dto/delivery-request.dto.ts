import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DeliveryRequestDto {
  @ApiProperty({ example: 'ord_12345' })
  @IsString()
  order_id!: string;

  @ApiPropertyOptional({ example: 'doordash' })
  @IsOptional()
  @IsString()
  provider?: string;
}
