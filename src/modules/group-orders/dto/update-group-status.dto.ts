import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateGroupStatusDto {
  @ApiProperty({ example: 'completed' })
  @IsString()
  status!: 'active' | 'completed' | 'cancelled' | 'expired';
}
