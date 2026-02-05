import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AddGroupItemDto {
  @IsString()
  participantName!: string;

  menuItem!: { id: string; name: string; price: number; image?: string };

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  selectedVariation?: unknown;

  @IsOptional()
  selectedOptions?: unknown;

  @IsOptional()
  @IsString()
  specialInstructions?: string;
}
