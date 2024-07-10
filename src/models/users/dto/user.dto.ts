import { IsDate, IsEmail, IsNotEmpty } from 'class-validator';

export class UserDTO {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  dni: string;

  @IsDate()
  @IsNotEmpty()
  birthDate: Date;
}
