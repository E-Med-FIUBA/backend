import { Controller, Get } from '@nestjs/common';
import { InsuranceService } from './insurance.service';

@Controller('insurance')
export class SpecialtyController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Get()
  findAll() {
    return this.insuranceService.findAll();
  }
}
