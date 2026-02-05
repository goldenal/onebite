import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PaymentLinkDto {
  @ApiPropertyOptional({ example: 'user_123' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiProperty({ example: 'ord_12345' })
  @IsString()
  order_id!: string;

  @ApiProperty({ example: 42.75 })
  @IsNumber()
  amount!: number;
}
