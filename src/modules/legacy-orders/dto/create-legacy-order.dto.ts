import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLegacyOrderDto {
  items!: unknown;

  @IsNumber()
  total!: number;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;
}
