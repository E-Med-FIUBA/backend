import { IsNotEmpty } from 'class-validator';

export class CreatePatientNoteDto {
  @IsNotEmpty()
  note: string;
}
