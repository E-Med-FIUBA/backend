import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class DoctorUpdateDTO {
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsNotEmpty()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsNumber()
  @IsOptional()
  dni?: number;

  @Type(() => Number)
  @IsNumber()
  specialtyId?: number;
}
