import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from '../patients.service';
import { Patient } from '@prisma/client';
import { PrismaService } from '../../../prisma.service';

describe('PatientsService', () => {
  let service: PatientsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientsService, PrismaService],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a new patient', async () => {
      const patientData: Omit<Patient, 'id'> = {
        name: 'John',
        lastName: 'Doe',
        doctorId: 1,
        insuranceCompanyId: 1,
        dni: 0,
        email: '',
        birthDate: undefined,
        sex: 'MALE',
        affiliateNumber: 0,
      };
      jest
        .spyOn(prisma.patient, 'create')
        .mockResolvedValue({ id: 1, ...patientData });

      expect(await service.create(patientData)).toEqual({
        id: 1,
        ...patientData,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of patients', async () => {
      const patients: Patient[] = [
        {
          id: 1,
          name: 'John',
          lastName: 'Doe',
          doctorId: 1,
          insuranceCompanyId: 1,
          dni: 0,
          email: '',
          birthDate: undefined,
          sex: 'MALE',
          affiliateNumber: 0,
        },
      ];
      jest.spyOn(prisma.patient, 'findMany').mockResolvedValue(patients);

      expect(await service.findAll()).toEqual(patients);
    });
  });

  describe('findAllByDoctor', () => {
    it('should return an array of patients for a specific doctor', async () => {
      const doctorId = 1;
      const patients: Patient[] = [
        {
          id: 1,
          name: 'John',
          lastName: 'Doe',
          doctorId,
          insuranceCompanyId: 1,
          dni: 0,
          email: '',
          birthDate: undefined,
          sex: 'MALE',
          affiliateNumber: 0,
        },
      ];
      jest.spyOn(prisma.patient, 'findMany').mockResolvedValue(patients);

      expect(await service.findAllByDoctor(doctorId)).toEqual(patients);
    });
  });

  describe('findOne', () => {
    it('should return a single patient', async () => {
      const patient: Patient = {
        id: 1,
        name: 'John',
        lastName: 'Doe',
        doctorId: 1,
        insuranceCompanyId: 1,
        dni: 0,
        email: '',
        birthDate: undefined,
        sex: 'MALE',
        affiliateNumber: 0,
      };
      jest.spyOn(prisma.patient, 'findUnique').mockResolvedValue(patient);

      expect(await service.findOne(1)).toEqual(patient);
    });
  });

  describe('update', () => {
    it('should update a patient', async () => {
      const patientData: Patient = {
        id: 1,
        name: 'John',
        lastName: 'Doe',
        doctorId: 1,
        insuranceCompanyId: 1,
        dni: 0,
        email: '',
        birthDate: undefined,
        sex: 'MALE',
        affiliateNumber: 0,
      };
      jest.spyOn(prisma.patient, 'update').mockResolvedValue(patientData);

      expect(await service.update(1, patientData)).toEqual(patientData);
    });
  });

  describe('remove', () => {
    it('should remove a patient', async () => {
      const patient: Patient = {
        id: 1,
        name: 'John',
        lastName: 'Doe',
        doctorId: 1,
        insuranceCompanyId: 1,
        dni: 0,
        email: '',
        birthDate: undefined,
        sex: 'MALE',
        affiliateNumber: 0,
      };
      jest.spyOn(prisma.patient, 'delete').mockResolvedValue(patient);

      expect(await service.remove(1)).toEqual(patient);
    });
  });

  describe('findDoctorPatients', () => {
    it('should return an array of patients for a specific doctor including insurance company', async () => {
      const doctorId = 1;
      const patients: Patient[] = [
        {
          id: 1,
          name: 'John',
          lastName: 'Doe',
          doctorId,
          insuranceCompanyId: 1,
          dni: 0,
          email: '',
          birthDate: undefined,
          sex: 'MALE',
          affiliateNumber: 0,
        },
      ];
      jest.spyOn(prisma.patient, 'findMany').mockResolvedValue(patients);

      expect(await service.findDoctorPatients(doctorId)).toEqual(patients);
    });
  });

  describe('getNotes', () => {
    it('should return an array of patient notes', async () => {
      const patientId = 1;
      const notes = [
        {
          id: 1,
          patientId,
          note: 'Test note',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      jest.spyOn(prisma.patientNote, 'findMany').mockResolvedValue(notes);

      expect(await service.getNotes(patientId)).toEqual(notes);
    });
  });
});
