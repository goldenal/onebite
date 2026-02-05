import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsNumber()
  rating!: number;

  @IsString()
  review!: string;

  @IsOptional()
  @IsString()
  occasion?: string;
}
