import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PaymentLinkDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsString()
  order_id!: string;

  @IsNumber()
  amount!: number;
}
