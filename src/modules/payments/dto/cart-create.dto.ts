import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CartCreateDto {
  @ApiPropertyOptional({ example: 'user_123' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiProperty({
    example: [
      { id: 'menu_1', name: 'Jerk Chicken Plate', price: 18.5, quantity: 1 },
      { id: 'menu_2', name: 'Plantains', price: 6, quantity: 2 },
    ],
  })
  items!: unknown;

  @ApiProperty({ example: 30.5 })
  @IsNumber()
  amount!: number;

  @ApiProperty({ example: 'pickup' })
  @IsString()
  fulfillment!: 'pickup' | 'delivery' | 'tablet';

  @ApiPropertyOptional({ example: 'web' })
  @IsOptional()
  @IsString()
  channel?: 'web' | 'phone' | 'tablet';

  @ApiPropertyOptional({ example: 'Chris Brown' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: '+1-415-555-0199' })
  @IsOptional()
  @IsString()
  customerPhone?: string;
}
