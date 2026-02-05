import { IsString, MinLength } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @MinLength(1)
  username!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
