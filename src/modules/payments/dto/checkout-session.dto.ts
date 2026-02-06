import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CheckoutSessionDto {
  @ApiProperty({ example: 'ord_12345' })
  @IsString()
  order_id!: string;

  @ApiPropertyOptional({ example: 'quote_12345' })
  @IsOptional()
  @IsString()
  quote_id?: string;
}
