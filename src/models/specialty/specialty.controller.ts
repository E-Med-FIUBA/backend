import { Controller, Get, UseGuards } from '@nestjs/common';
import { SpecialtyService } from './specialty.service';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('specialty')
export class SpecialtyController {
  constructor(private readonly specialtyService: SpecialtyService) {}

  @Get()
  findAll() {
    return this.specialtyService.findAll();
  }
}
