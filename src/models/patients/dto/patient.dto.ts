import { Sex } from '@prisma/client';
import { IsDate, IsEmail, IsEnum, IsNumber, IsString } from 'class-validator';

export class PatientDTO {
  @IsNumber()
  doctorId: number;

  @IsDate()
  birthDate: Date;

  @IsNumber()
  insurancePlanId: number;

  @IsNumber()
  affiliateNumber: number;

  @IsNumber()
  dni: number;

  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  lastName: string;

  @IsEnum(Sex)
  sex: Sex;
}
