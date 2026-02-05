import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateGroupOrderDto {
  @ApiProperty({ example: 'Alex' })
  @IsString()
  initiatorName!: string;
}
