import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateReplyDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  senderType!: 'admin' | 'customer';

  @ApiProperty({ example: 'Ava Manager' })
  @IsString()
  senderName!: string;

  @ApiProperty({ example: 'Thanks for the feedback!' })
  @IsString()
  message!: string;
}

export class CreatePublicReplyDto {
  @ApiProperty({ example: 'Thanks for reaching out.' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({ example: 'rev_9f2a31' })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  senderName?: string;
}

export class RequestAccessDto {
  @ApiProperty({ example: 'guest@example.com' })
  @IsEmail()
  email!: string;
}

export class MyReviewsDto {
  @ApiProperty({ example: 'guest@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'rev_9f2a31' })
  @IsOptional()
  @IsString()
  accessToken?: string;
}

export class MarkReadDto {
  @ApiProperty({ example: 'customer' })
  @IsString()
  senderType!: string;

  @ApiPropertyOptional({ example: 'rev_9f2a31' })
  @IsOptional()
  @IsString()
  accessToken?: string;
}
