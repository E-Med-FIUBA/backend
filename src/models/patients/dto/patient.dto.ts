import { Sex } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsString,
} from 'class-validator';

export class PatientDTO {
  doctorId: number;

  @IsDateString()
  birthDate: Date;

  @IsNumber()
  insuranceCompanyId: number;

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
