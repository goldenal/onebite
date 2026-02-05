import { IsOptional, IsString } from 'class-validator';

export class DeliveryWebhookDto {
  @IsString()
  order_id!: string;

  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  eta?: string;

  @IsOptional()
  @IsString()
  delivery_id?: string;
}
