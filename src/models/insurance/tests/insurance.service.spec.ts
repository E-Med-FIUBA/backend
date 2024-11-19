import { Test, TestingModule } from '@nestjs/testing';
import { InsuranceService } from '../insurance.service';
import { PrismaService } from '../../../prisma.service';

describe('InsuranceService', () => {
  let service: InsuranceService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InsuranceService, PrismaService],
    }).compile();

    service = module.get<InsuranceService>(InsuranceService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of insurance companies', async () => {
      const result = [{ id: 1, name: 'Company A', code: '01' }];
      jest
        .spyOn(prismaService.insuranceCompany, 'findMany')
        .mockResolvedValue(result);

      expect(await service.findAll()).toBe(result);
    });
  });

  describe('findOne', () => {
    it('should return a single insurance company', async () => {
      const result = { id: 1, name: 'Company A', code: '01' };
      jest
        .spyOn(prismaService.insuranceCompany, 'findUnique')
        .mockResolvedValue(result);

      expect(await service.findOne(1)).toBe(result);
    });

    it('should return null if no insurance company is found', async () => {
      jest
        .spyOn(prismaService.insuranceCompany, 'findUnique')
        .mockResolvedValue(null);

      expect(await service.findOne(999)).toBeNull();
    });
  });
});
