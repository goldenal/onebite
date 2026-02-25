import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PlatformLoginDto {
  @ApiProperty({ example: 'platform-admin' })
  @IsString()
  username!: string;

  @ApiProperty({ example: 'strongPassword123' })
  @IsString()
  password!: string;
}
