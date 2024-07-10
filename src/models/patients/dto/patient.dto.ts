import { IsNumber } from 'class-validator';
import { UserDTO } from '../../users/dto/user.dto';

export class PatientDTO extends UserDTO {
  @IsNumber()
  doctorId: number;
}
