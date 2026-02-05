import { IsOptional, IsString } from 'class-validator';

export class DeliveryRequestDto {
  @IsString()
  order_id!: string;

  @IsOptional()
  @IsString()
  provider?: string;
}
