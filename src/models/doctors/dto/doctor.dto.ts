import { IsNotEmpty } from 'class-validator';
import { UserDTO } from '../../users/dto/user.dto';

export class DoctorDTO extends UserDTO {
  @IsNotEmpty()
  certification: string;
}
