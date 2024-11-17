import { IsNotEmpty, IsNumber, Validate } from 'class-validator';
import { UserRegisterDTO } from '../../users/dto/user-register.dto';
import { Type } from 'class-transformer';
import { pki } from 'node-forge';

export class DoctorRegisterDTO extends UserRegisterDTO {
  @IsNotEmpty()
  license: string;

  @Type(() => Number)
  @IsNumber()
  specialtyId: number;

  @IsNotEmpty()
  @Validate(
    (object: DoctorRegisterDTO) =>
      object.certificate && !!pki.certificateFromPem(object.certificate),
  )
  certificate: string;
}
