import { IsNotEmpty } from 'class-validator';
import { UserRegisterDTO } from '../../users/dto/user-register.dto';
import { ApiProperty } from '@nestjs/swagger';

export class DoctorRegisterDTO extends UserRegisterDTO {
  @ApiProperty()
  @IsNotEmpty()
  certification: string;
}
