import { Sex } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class PatientlessPrescriptionDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsNumber()
  dni: number;

  @IsEnum(Sex)
  @IsNotEmpty()
  sex: Sex;

  @IsDateString()
  @IsNotEmpty()
  birthDate: Date;

  @IsEmail()
  email: string;

  @IsNumber()
  insuranceCompanyId: number;

  @IsNumber()
  affiliateNumber: number;

  @IsNumber()
  @IsNotEmpty()
  presentationId: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  indication: string;

  @IsString()
  @IsNotEmpty()
  signature: string;
}
