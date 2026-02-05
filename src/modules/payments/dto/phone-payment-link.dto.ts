import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PhonePaymentLinkDto {
  items!: unknown;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  fulfillment?: 'pickup' | 'delivery';
}
