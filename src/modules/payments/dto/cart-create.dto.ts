import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CartCreateDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  items!: unknown;

  @IsNumber()
  amount!: number;

  @IsString()
  fulfillment!: 'pickup' | 'delivery' | 'tablet';

  @IsOptional()
  @IsString()
  channel?: 'web' | 'phone' | 'tablet';

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;
}
