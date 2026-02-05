import { IsOptional, IsString } from 'class-validator';

export class UpdateLegacyOrderDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;
}
