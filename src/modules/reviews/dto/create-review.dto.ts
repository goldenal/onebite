import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  rating!: number;

  @ApiProperty({ example: 'Great food and friendly staff.' })
  @IsString()
  review!: string;

  @ApiPropertyOptional({ example: 'Birthday' })
  @IsOptional()
  @IsString()
  occasion?: string;
}
