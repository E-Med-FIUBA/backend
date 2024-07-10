import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PrescriptionDTO {
  @IsNumber()
  @IsNotEmpty()
  patientId: number;

  @IsNumber()
  @IsNotEmpty()
  doctorId: number;

  @IsNumber()
  @IsNotEmpty()
  drugId: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  frequency: number;

  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @IsNumber()
  @IsNotEmpty()
  endDate: Date;

  @IsString()
  @IsNotEmpty()
  indication: string;
}
