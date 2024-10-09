import { IsNotEmpty, IsNumber } from 'class-validator';
import { UserRegisterDTO } from '../../users/dto/user-register.dto';

export class DoctorRegisterDTO extends UserRegisterDTO {
  @IsNotEmpty()
  license: string;

  @IsNumber()
  specialtyId: number;
}
