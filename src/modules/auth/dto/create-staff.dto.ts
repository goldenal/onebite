import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateStaffDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(1)
  username!: string;

  @ApiProperty({ example: 'adminadmin' })
  @IsString()
  @MinLength(6)
  password!: string;
}
