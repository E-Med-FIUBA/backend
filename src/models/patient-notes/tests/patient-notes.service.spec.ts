import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma.service';
import { PatientNotesService } from '../patient-notes.service';

describe('PatientNotesService', () => {
  let service: PatientNotesService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientNotesService, PrismaService],
    }).compile();

    service = module.get<PatientNotesService>(PatientNotesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a patient note', async () => {
      const patientId = 1;
      const createPatientNoteDto = {
        title: 'Note 1',
        content: 'Content 1',
        note: 'Note 1',
      };
      jest
        .spyOn(prismaService.patientNote, 'create')
        .mockResolvedValue({ id: 1 } as any);

      const result = await service.create(patientId, createPatientNoteDto);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('remove', () => {
    it('should remove a patient note', async () => {
      const patientNoteId = 1;
      jest
        .spyOn(prismaService.patientNote, 'delete')
        .mockResolvedValue({ id: 1 } as any);

      const result = await service.remove(patientNoteId);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('update', () => {
    it('should update a patient note', async () => {
      const patientNoteId = 1;
      const updatePatientNoteDto = {
        title: 'Note 1',
        content: 'Content 1',
        note: 'Note 1',
      };
      jest
        .spyOn(prismaService.patientNote, 'update')
        .mockResolvedValue({ id: 1 } as any);

      const result = await service.update(patientNoteId, updatePatientNoteDto);
      expect(result).toEqual({ id: 1 });
    });
  });
});
