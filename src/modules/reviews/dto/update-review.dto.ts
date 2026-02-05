import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateReviewDto {
  @IsOptional()
  @IsBoolean()
  approved?: boolean;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
