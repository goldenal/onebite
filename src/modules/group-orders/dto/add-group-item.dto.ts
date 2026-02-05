import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AddGroupItemDto {
  @ApiProperty({ example: 'Taylor' })
  @IsString()
  participantName!: string;

  @ApiProperty({
    example: { id: 'menu_1', name: 'Jerk Chicken Plate', price: 18.5, image: 'https://cdn.example.com/menu/jerk.jpg' },
  })
  menuItem!: { id: string; name: string; price: number; image?: string };

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ example: { name: 'Spice Level', value: 'Hot' } })
  @IsOptional()
  selectedVariation?: unknown;

  @ApiPropertyOptional({ example: [{ name: 'Sides', values: ['Fries'] }] })
  @IsOptional()
  selectedOptions?: unknown;

  @ApiPropertyOptional({ example: 'No onions, please.' })
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}
