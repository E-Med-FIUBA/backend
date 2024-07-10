import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientDTO } from './dto/patient.dto';
import { AuthGuard } from '../../auth/auth.guard';

@Controller('patients')
@UseGuards(AuthGuard)
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Post()
  create(@Body() data: PatientDTO) {
    return this.patientsService.create(data);
  }

  @Get()
  findAll() {
    return this.patientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.patientsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: PatientDTO) {
    return this.patientsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.patientsService.remove(id);
  }
}
