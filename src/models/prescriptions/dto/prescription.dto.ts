import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PrescriptionDTO {
  @IsNumber()
  @IsNotEmpty()
  patientId: number;

  @IsNumber()
  @IsNotEmpty()
  presentationId: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  indication: string;
}
