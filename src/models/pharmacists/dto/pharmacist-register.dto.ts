import { IsNotEmpty } from 'class-validator';
import { UserRegisterDTO } from '../../users/dto/user-register.dto';

export class PharmacistRegisterDTO extends UserRegisterDTO {
  @IsNotEmpty()
  certification: string;
}
