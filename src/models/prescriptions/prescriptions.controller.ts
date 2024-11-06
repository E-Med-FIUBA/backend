import { Prescription } from '@prisma/client';
import { PrescriptionsService } from './prescriptions.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PrescriptionDTO } from './dto/prescription.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { MailingService } from 'src/mailing/mailing.service';
import { PatientlessPrescriptionDTO } from './dto/patientless-prescription.dto';
import { PatientsService } from '../patients/patients.service';

@ApiTags('prescriptions')
@Controller('prescriptions')
@UseGuards(AuthGuard)
export class PrescriptionsController {
  constructor(
    private prescriptionsService: PrescriptionsService,
    private patientsService: PatientsService,
    private mailingService: MailingService,
  ) {}

  @Get()
  findAll(@Req() req): Promise<Prescription[]> {
    const doctorId = req.user?.doctor?.id;
    if (!doctorId) {
      throw new UnauthorizedException('Unauthorized');
    }
    return this.prescriptionsService.findAllByDoctor(doctorId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Prescription> {
    return this.prescriptionsService.findOne(id);
  }

  @Get(':id/verify')
  verify(@Param('id', ParseIntPipe) id: number): Promise<Prescription> {
    return this.prescriptionsService.verify(id);
  }

  @Post()
  async create(
    @Body() prescriptionDTO: PrescriptionDTO,
    @Req() req,
  ): Promise<Prescription> {
    const doctorId = req.user?.doctor?.id;
    if (!doctorId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const prescription = await this.prescriptionsService.create({
      ...prescriptionDTO,
      emitedAt: new Date(),
      doctorId,
      used: false,
    });

    this.mailingService.sendPrescription(
      prescription.patient.email,
      prescription.patient,
      prescription.doctor,
      prescription,
    );
    return prescription;
  }

  @Post('patientless')
  async createPatientless(
    @Body() prescriptionDTO: PatientlessPrescriptionDTO,
    @Req() req,
  ): Promise<Prescription> {
    const doctorId = req.user?.doctor?.id;
    if (!doctorId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const patient = await this.patientsService.create({
      name: prescriptionDTO.name,
      lastName: prescriptionDTO.lastName,
      email: prescriptionDTO.email,
      insuranceCompanyId: prescriptionDTO.insuranceCompanyId,
      birthDate: prescriptionDTO.birthDate,
      dni: prescriptionDTO.dni,
      affiliateNumber: prescriptionDTO.affiliateNumber,
      sex: prescriptionDTO.sex,
      doctorId: null,
    });

    const prescription = await this.prescriptionsService.create({
      ...prescriptionDTO,
      patientId: patient.id,
      emitedAt: new Date(),
      doctorId,
      used: false,
    });

    this.mailingService.sendPrescription(
      patient.email,
      patient,
      prescription.doctor,
      prescription,
    );
    return prescription;
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() prescriptionDTO: PrescriptionDTO,
  ): Promise<Prescription> {
    return this.prescriptionsService.update(id, prescriptionDTO);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<Prescription> {
    return this.prescriptionsService.remove(id);
  }
}
