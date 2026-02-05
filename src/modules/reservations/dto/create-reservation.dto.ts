import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  guests!: string;

  @IsString()
  date!: string;

  @IsString()
  time!: string;

  @IsOptional()
  @IsString()
  specialRequests?: string;
}
