import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
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
  create(@Req() req, @Body() data: PatientDTO) {
    const doctorId = req.user?.doctor?.id;
    if (!doctorId) {
      throw new UnauthorizedException("You're not a doctor");
    }
    return this.patientsService.create({
      ...data,
      doctorId,
    });
  }

  @Get()
  findAll(@Req() req): Promise<Patient[]> {
    const doctorId = req.user?.doctor?.id;
    if (!doctorId) {
      throw new UnauthorizedException("You're not a doctor");
    }
    return this.patientsService.findAllByDoctor(doctorId);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.patientsService.findOne(id);
  }

  @Put(':id')
  update(@Req() req, @Param('id') id: number, @Body() data: PatientDTO) {
    const doctorId = req.user?.doctor?.id;
    if (!doctorId) {
      throw new UnauthorizedException("You're not a doctor");
    }
    return this.patientsService.update(id, {
      ...data,
      doctorId,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.patientsService.remove(id);
  }
}
