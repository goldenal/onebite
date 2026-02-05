import { IsString } from 'class-validator';

export class CreateGroupOrderDto {
  @IsString()
  initiatorName!: string;
}
