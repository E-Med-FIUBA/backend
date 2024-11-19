import { Sex } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  isISO8601,
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

  @Transform(({ value }) => {
    const isValidDate = isISO8601(value, {
      strict: true,
      strictSeparator: true,
    });
    if (!isValidDate) {
      throw new Error(
        `Property "from_date" should be a valid ISO8601 date string`,
      );
    }
    return new Date(value);
  })
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

  @Transform(({ value }) => {
    const isValidDate = isISO8601(value, {
      strict: true,
      strictSeparator: true,
    });
    if (!isValidDate) {
      throw new Error(
        `Property "emitedAt" should be a valid ISO8601 date string`,
      );
    }
    return new Date(value);
  })
  @IsNotEmpty()
  emitedAt: Date;
}
