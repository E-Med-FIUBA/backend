import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

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

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsDateString()
  @IsNotEmpty()
  emitedAt: string;
}
