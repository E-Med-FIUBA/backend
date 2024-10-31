import { Controller, Body, Param, Delete, Put } from '@nestjs/common';
import { PatientNotesService } from './patient-notes.service';
import { UpdatePatientNoteDto } from './dto/update-patient-note.dto';

@Controller('patient-notes')
export class PatientNotesController {
  constructor(private readonly patientNotesService: PatientNotesService) {}

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updatePatientNoteDto: UpdatePatientNoteDto,
  ) {
    return this.patientNotesService.update(+id, updatePatientNoteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.patientNotesService.remove(+id);
  }
}
