import { PartialType } from '@nestjs/swagger';
import { CreatePatientNoteDto } from './create-patient-note.dto';

export class UpdatePatientNoteDto extends PartialType(CreatePatientNoteDto) {}
