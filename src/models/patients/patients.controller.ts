import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientDTO } from './dto/patient.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { Patient } from '@prisma/client';

@ApiTags('patients')
@Controller('patients')
@UseGuards(AuthGuard)
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Post()
  create(@Body() data: PatientDTO) {
    return this.patientsService.create(data);
  }

  @Get()
  findAll(@Req() req): Promise<Patient[]> {
    const doctorId = req.user?.doctor?.id;
    if (!doctorId) {
      throw new Error('Unauthorized');
    }
    return this.patientsService.findAllByDoctor(doctorId);
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
