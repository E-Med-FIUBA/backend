import { Test, TestingModule } from '@nestjs/testing';
import { DoctorsService } from '../doctors.service';
import { PrismaService } from '../../../prisma.service';
import { PatientsService } from '../../patients/patients.service';
import { DoctorsTreeService } from '../../doctors-tree/doctors-tree.service';
import { ContractService } from '../../contract/contract.service';
import { MailingService } from '../../../mailing/mailing.service';
import { DoctorData } from '../../../signature/signature.service';
import { DoctorUpdateDTO } from '../dto/doctor-update.dto';

describe('DoctorsService', () => {
  let service: DoctorsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        PrismaService,
        PatientsService,
        DoctorsTreeService,
        ContractService,
        MailingService,
      ],
    }).compile();

    service = module.get<DoctorsService>(DoctorsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a doctor', async () => {
      const doctorData: DoctorData = {
        license: '12345',
        certificate: 'cert123',
        userId: 1,
        specialtyId: 1,
        name: 'John',
        lastName: 'Doe',
      };

      jest.spyOn(prismaService.doctor, 'create').mockResolvedValue({
        id: 1,
        license: '12345',
        certificate: 'cert123',
        userId: 1,
        specialtyId: 1,
      } as any);

      const result = await service.create(doctorData);
      expect(result).toEqual({
        id: 1,
        license: '12345',
        certificate: 'cert123',
        userId: 1,
        specialtyId: 1,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of doctors', async () => {
      const doctors = [
        { id: 1, license: '12345', certificate: 'cert123' },
        { id: 2, license: '67890', certificate: 'cert456' },
      ];

      jest
        .spyOn(prismaService.doctor, 'findMany')
        .mockResolvedValue(doctors as any);

      const result = await service.findAll();
      expect(result).toEqual(doctors);
    });
  });

  describe('findOne', () => {
    it('should return a single doctor', async () => {
      const doctor = { id: 1, license: '12345', certificate: 'cert123' };

      jest
        .spyOn(prismaService.doctor, 'findUnique')
        .mockResolvedValue(doctor as any);

      const result = await service.findOne(1);
      expect(result).toEqual(doctor);
    });
  });

  describe('update', () => {
    it('should update a doctor', async () => {
      const doctorUpdateDTO: DoctorUpdateDTO = {
        certificate: 'newCert',
        email: 'newemail@example.com',
        name: 'NewName',
        lastName: 'NewLastName',
        dni: 12345678,
        specialtyId: 2,
      };

      const updatedDoctor = { id: 1, license: '12345', certificate: 'newCert' };

      jest
        .spyOn(prismaService.doctor, 'update')
        .mockResolvedValue(updatedDoctor as any);

      const result = await service.update(1, doctorUpdateDTO);
      expect(result).toEqual(updatedDoctor);
    });
  });

  describe('remove', () => {
    it('should remove a doctor', async () => {
      const doctor = { id: 1, license: '12345', certificate: 'cert123' };

      jest
        .spyOn(prismaService.doctor, 'delete')
        .mockResolvedValue(doctor as any);

      const result = await service.remove(1);
      expect(result).toEqual(doctor);
    });
  });

  describe('getDoctorsPatients', () => {
    it('should return patients of a doctor', async () => {
      const patients = [
        { id: 1, name: 'Patient1' },
        { id: 2, name: 'Patient2' },
      ];

      jest
        .spyOn(service['patientsService'], 'findDoctorPatients')
        .mockResolvedValue(patients as any);

      const result = await service.getDoctorsPatients(1);
      expect(result).toEqual(patients);
    });
  });

  describe('getDoctorByUserId', () => {
    it('should return a doctor by user ID', async () => {
      const doctor = {
        id: 1,
        license: '12345',
        certificate: 'cert123',
        userId: 1,
      };

      jest
        .spyOn(prismaService.doctor, 'findUnique')
        .mockResolvedValue(doctor as any);

      const result = await service.getDoctorByUserId(1);
      expect(result).toEqual(doctor);
    });
  });

  describe('isActiveDoctor', () => {
    it('should return true if doctor is active', async () => {
      jest
        .spyOn(prismaService.doctorNodeQueue, 'findFirst')
        .mockResolvedValue(null);

      const result = await service.isActiveDoctor(1);
      expect(result).toBe(true);
    });

    it('should return false if doctor is not active', async () => {
      jest
        .spyOn(prismaService.doctorNodeQueue, 'findFirst')
        .mockResolvedValue({} as any);

      const result = await service.isActiveDoctor(1);
      expect(result).toBe(false);
    });
  });
});
