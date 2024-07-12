import { IsNotEmpty } from 'class-validator';
import { UserRegisterDTO } from '../../users/dto/user-register.dto';
import { ApiProperty } from '@nestjs/swagger';

export class DoctorRegisterDTO extends UserRegisterDTO {
  @IsNotEmpty()
  license: string;

  @IsNotEmpty()
  specialty: string;
}
