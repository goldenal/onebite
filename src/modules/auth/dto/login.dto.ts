import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'tenant_bitter',
    description: 'Optional tenant ID for disambiguation when this credential belongs to multiple restaurants.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  tenantId?: string;

  @ApiProperty({ example: 'owner@restaurant.com', description: 'Email or legacy username.' })
  @IsString()
  @MinLength(1)
  username!: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @MinLength(1)
  password!: string;
}
