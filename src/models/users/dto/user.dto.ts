import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class UserDTO {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsNumber()
  dni: number;
}
