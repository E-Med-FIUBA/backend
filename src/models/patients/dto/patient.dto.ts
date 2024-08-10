import { IsDate, IsEmail, IsEnum, IsNumber } from 'class-validator';
import { UserDTO } from '../../users/dto/user.dto';
import { Sex } from '@prisma/client';

export class PatientDTO extends UserDTO {
  @IsNumber()
  doctorId: number;

  @IsDate()
  birthDate: Date;

  @IsNumber()
  dni: number;

  @IsEmail()
  email: string;

  @IsEnum(Sex)
  sex: Sex;
}
