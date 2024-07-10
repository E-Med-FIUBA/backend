import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResetPasswordRequest {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
