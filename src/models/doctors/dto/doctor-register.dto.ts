import { IsNotEmpty, IsNumber } from 'class-validator';
import { UserRegisterDTO } from '../../users/dto/user-register.dto';
import { Type } from 'class-transformer';

export class DoctorRegisterDTO extends UserRegisterDTO {
  @IsNotEmpty()
  license: string;

  @Type(() => Number)
  @IsNumber()
  specialtyId: number;

  @IsNotEmpty()
  certificateRequest: string;
}
