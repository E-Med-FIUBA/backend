import { IsNotEmpty, IsStrongPassword } from 'class-validator';
import { UserDTO } from './user.dto';

export class UserRegisterDTO extends UserDTO {
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;
}
