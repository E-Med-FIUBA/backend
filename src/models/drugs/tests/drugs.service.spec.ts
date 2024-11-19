import { Test, TestingModule } from '@nestjs/testing';
import { DrugsService } from '../drugs.service';
import { PrismaService } from '../../../prisma.service';
import { Drug } from '@prisma/client';

describe('DrugsService', () => {
  let service: DrugsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DrugsService, PrismaService],
    }).compile();

    service = module.get<DrugsService>(DrugsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new drug', async () => {
      const drugData: Omit<Drug, 'id'> = {
        name: 'Aspirin',
        description: 'Pain reliever',
        atc: 'N02BA01',
      };

      jest.spyOn(prismaService.drug, 'create').mockResolvedValue({
        id: 1,
        ...drugData,
      });

      expect(await service.create(drugData)).toEqual({
        id: 1,
        ...drugData,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of drugs', async () => {
      const drugs: Drug[] = [
        {
          id: 1,
          name: 'Aspirin',
          description: 'Pain reliever',
          atc: 'N02BA01',
        },
        {
          id: 2,
          name: 'Ibuprofen',
          description: 'Anti-inflammatory',
          atc: 'M01AE01',
        },
      ];

      jest.spyOn(prismaService.drug, 'findMany').mockResolvedValue(drugs);

      expect(await service.findAll()).toEqual(drugs);
    });
  });

  describe('findOne', () => {
    it('should return a single drug', async () => {
      const drug: Drug = {
        id: 1,
        name: 'Aspirin',
        description: 'Pain reliever',
        atc: 'N02BA01',
      };

      jest.spyOn(prismaService.drug, 'findUnique').mockResolvedValue(drug);

      expect(await service.findOne(1)).toEqual(drug);
    });
  });

  describe('update', () => {
    it('should update a drug', async () => {
      const drugData = {
        id: 1,
        name: 'Aspirin',
        description: 'Pain reliever',
        atc: '1',
      };
      const updatedDrug: Drug = { id: 1, ...drugData, atc: 'N02BA01' };

      jest.spyOn(prismaService.drug, 'update').mockResolvedValue(updatedDrug);

      expect(await service.update(1, drugData)).toEqual(updatedDrug);
    });
  });

  describe('remove', () => {
    it('should delete a drug', async () => {
      const drug: Drug = {
        id: 1,
        name: 'Aspirin',
        description: 'Pain reliever',
        atc: 'N02BA01',
      };

      jest.spyOn(prismaService.drug, 'delete').mockResolvedValue(drug);

      expect(await service.remove(1)).toEqual(drug);
    });
  });

  describe('getMetrics', () => {
    it('should return drug usage metrics for a pharmacist', async () => {
      const metrics = [
        {
          id: 1,
          name: 'Aspirin',
          description: '',
          atc: '',
          presentations: [
            {
              prescriptions: [{ pharmacistId: 1, quantity: 10 }],
            },
          ],
        },
      ];

      jest.spyOn(prismaService.drug, 'findMany').mockResolvedValue(metrics);

      expect(await service.getMetrics(1)).toEqual(metrics);
    });
  });

  describe('search', () => {
    it('should return search results', async () => {
      const drugs: Drug[] = [
        {
          id: 1,
          name: 'Aspirin',
          description: 'Pain reliever',
          atc: 'N02BA01',
        },
      ];

      jest.spyOn(prismaService.drug, 'findMany').mockResolvedValue(drugs);

      expect(await service.search('Aspirin', 1, 10)).toEqual(drugs);
    });
  });
});
