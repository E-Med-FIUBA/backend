import { Controller, Get, UseGuards } from '@nestjs/common';
import { SpecialtyService } from './specialty.service';
import { DoctorGuard } from 'src/auth/guards/doctor.guard';

@Controller('specialty')
@UseGuards(DoctorGuard)
export class SpecialtyController {
  constructor(private readonly specialtyService: SpecialtyService) { }

  @Get()
  findAll() {
    return this.specialtyService.findAll();
  }
}
