import { IsString } from 'class-validator';

export class UpdateGroupStatusDto {
  @IsString()
  status!: 'active' | 'completed' | 'cancelled' | 'expired';
}
