import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DeliveryWebhookDto {
  @ApiProperty({ example: 'ord_12345' })
  @IsString()
  order_id!: string;

  @ApiProperty({ example: 'delivered' })
  @IsString()
  status!: string;

  @ApiPropertyOptional({ example: '2026-02-05T19:45:00Z' })
  @IsOptional()
  @IsString()
  eta?: string;

  @ApiPropertyOptional({ example: 'del_67890' })
  @IsOptional()
  @IsString()
  delivery_id?: string;
}
