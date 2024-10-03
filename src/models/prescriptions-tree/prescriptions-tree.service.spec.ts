import { Test, TestingModule } from '@nestjs/testing';
import { PrescriptionsTreeService } from './prescriptions-tree.service';

describe('PrescriptionsTreeService', () => {
  let service: PrescriptionsTreeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrescriptionsTreeService],
    }).compile();

    service = module.get<PrescriptionsTreeService>(PrescriptionsTreeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
