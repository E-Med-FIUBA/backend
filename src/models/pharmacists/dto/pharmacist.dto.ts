import { IsNotEmpty } from 'class-validator';
import { UserDTO } from '../../users/dto/user.dto';

export class PharmacistDTO extends UserDTO {
  @IsNotEmpty()
  certification: string;
}
