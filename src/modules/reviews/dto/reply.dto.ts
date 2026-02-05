import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateReplyDto {
  @IsString()
  senderType!: 'admin' | 'customer';

  @IsString()
  senderName!: string;

  @IsString()
  message!: string;
}

export class CreatePublicReplyDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  senderName?: string;
}

export class RequestAccessDto {
  @IsEmail()
  email!: string;
}

export class MyReviewsDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  accessToken?: string;
}

export class MarkReadDto {
  @IsString()
  senderType!: string;

  @IsOptional()
  @IsString()
  accessToken?: string;
}
