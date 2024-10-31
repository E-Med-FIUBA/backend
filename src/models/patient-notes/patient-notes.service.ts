import { Injectable } from '@nestjs/common';
import { CreatePatientNoteDto } from './dto/create-patient-note.dto';
import { UpdatePatientNoteDto } from './dto/update-patient-note.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PatientNotesService {
  constructor(private prisma: PrismaService) {}

  create(patientId: number, createPatientNoteDto: CreatePatientNoteDto) {
    return this.prisma.patientNote.create({
      data: {
        ...createPatientNoteDto,
        patient: {
          connect: {
            id: patientId,
          },
        },
        createdAt: new Date(),
        updatedAt: null,
      },
    });
  }

  update(id: number, updatePatientNoteDto: UpdatePatientNoteDto) {
    return this.prisma.patientNote.update({
      where: {
        id,
      },
      data: {
        ...updatePatientNoteDto,
        updatedAt: new Date(),
      },
    });
  }

  remove(id: number) {
    return this.prisma.patientNote.delete({
      where: {
        id,
      },
    });
  }
}
