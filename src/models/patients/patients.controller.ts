import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientDTO } from './dto/patient.dto';
import { ApiTags } from '@nestjs/swagger';
import { Patient } from '@prisma/client';
import { PatientNotesService } from '../patient-notes/patient-notes.service';
import { CreatePatientNoteDto } from '../patient-notes/dto/create-patient-note.dto';
import { DoctorGuard } from '../../auth/guards/doctor.guard';

@ApiTags('patients')
@Controller('patients')
@UseGuards(DoctorGuard)
export class PatientsController {
  constructor(
    private patientsService: PatientsService,
    private patientNotesService: PatientNotesService,
  ) {}

  @Post()
  create(@Req() req, @Body() data: PatientDTO) {
    const doctorId = req.user?.doctor?.id;
    if (!doctorId) {
      throw new UnauthorizedException("You're not a doctor");
    }
    return this.patientsService.create({
      ...data,
      doctorId,
    });
  }

  @Get()
  findAll(@Req() req): Promise<Patient[]> {
    const doctorId = req.user?.doctor?.id;
    if (!doctorId) {
      throw new UnauthorizedException("You're not a doctor");
    }
    return this.patientsService.findAllByDoctor(doctorId);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.patientsService.findOne(id);
  }

  @Put(':id')
  update(@Req() req, @Param('id') id: number, @Body() data: PatientDTO) {
    const doctorId = req.user?.doctor?.id;
    if (!doctorId) {
      throw new UnauthorizedException("You're not a doctor");
    }
    return this.patientsService.update(id, {
      ...data,
      doctorId,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.patientsService.remove(id);
  }

  @Get(':id/notes')
  getNotes(@Param('id') id: number) {
    return this.patientsService.getNotes(id);
  }

  @Post(':id/notes')
  addNote(@Param('id') id: number, @Body() patientNote: CreatePatientNoteDto) {
    return this.patientNotesService.create(id, patientNote);
  }
}
