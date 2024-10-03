import { Test, TestingModule } from '@nestjs/testing';
import { DoctorsTreeService } from './doctors-tree.service';

describe('DoctorsTreeService', () => {
  let service: DoctorsTreeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DoctorsTreeService],
    }).compile();

    service = module.get<DoctorsTreeService>(DoctorsTreeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
