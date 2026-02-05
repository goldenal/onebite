import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  dietary?: string[];

  @IsOptional()
  @IsBoolean()
  popular?: boolean;

  @IsOptional()
  variations?: unknown;

  @IsOptional()
  optionGroups?: unknown;

  @IsOptional()
  includes?: unknown;

  @IsOptional()
  @IsString()
  notes?: string;
}
