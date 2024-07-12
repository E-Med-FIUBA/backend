import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { DoctorDTO } from './dto/doctor.dto';
import { DoctorsService } from './doctors.service';
import { AuthGuard } from '../../auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('doctors')
@Controller('doctors')
@UseGuards(AuthGuard)
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) {}
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.doctorsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: DoctorDTO) {
    return this.doctorsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.doctorsService.remove(id);
  }

  @Get(':id/patients')
  public getDoctorsPatients(@Param('id') id: number) {
    return this.doctorsService.getDoctorsPatients(id);
  }
}
