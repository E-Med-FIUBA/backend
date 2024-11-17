import { Prescription } from '@prisma/client';
import { PrescriptionsService } from './prescriptions.service';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PrescriptionDTO } from './dto/prescription.dto';
import { ApiTags } from '@nestjs/swagger';
import { MailingService } from 'src/mailing/mailing.service';
import { PatientlessPrescriptionDTO } from './dto/patientless-prescription.dto';
import { PatientsService } from '../patients/patients.service';
import { DoctorGuard } from 'src/auth/guards/doctor.guard';
import { PharmacistGuard } from 'src/auth/guards/pharmacist.guard';
import { ReqUser } from 'src/utils/req_user';

@ApiTags('prescriptions')
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(
    private prescriptionsService: PrescriptionsService,
    private patientsService: PatientsService,
    private mailingService: MailingService,
  ) { }

  @Post(':id/use')
  @UseGuards(PharmacistGuard)
  markAsUsed(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: ReqUser,
  ): Promise<Prescription> {
    return this.prescriptionsService.markAsUsed(id, req.user!.pharmacist.id);
  }

  @Post('manual-send')
  @UseGuards(DoctorGuard)
  async manualSend(
    @Body('prescriptionId') prescriptionId: number,
    @Req() req,
  ): Promise<Prescription> {
    const doctorId = req.user?.doctor?.id;
    if (!doctorId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const prescription = await this.prescriptionsService.findOne(prescriptionId);

    this.mailingService.sendPrescription(prescription.patient.email, prescription.patient, prescription.doctor, prescription);

    return prescription;
  }

  @Get('history')
  @UseGuards(PharmacistGuard)
  findAllUsed(@Req() req): Promise<Prescription[]> {
    const pharmacistId = req.user?.pharmacist?.id;
    return this.prescriptionsService.findAllByPharmacist(pharmacistId);
  }

  @Get('metrics')
  @UseGuards(PharmacistGuard)
  getMetrics(@Req() req): Promise<any> {
    const pharmacistId = req.user?.pharmacist?.id;
    return this.prescriptionsService.getMetrics(pharmacistId);
  }

  @Get()
  @UseGuards(DoctorGuard)
  findAll(@Req() req): Promise<Prescription[]> {
    const doctorId = req.user?.doctor?.id;
    if (!doctorId) {
      throw new UnauthorizedException('Unauthorized');
    }
    return this.prescriptionsService.findAllByDoctor(doctorId);
  }

  @Get(':id')
  @UseGuards(DoctorGuard)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Prescription> {
    return this.prescriptionsService.findOne(id);
  }

  @Get(':id/verify')
  @UseGuards(PharmacistGuard)
  verify(@Param('id', ParseIntPipe) id: number): Promise<Prescription> {
    return this.prescriptionsService.verify(id);
  }

  @Post()
  @UseGuards(DoctorGuard)
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
      emitedAt: prescriptionDTO.emitedAt,
      doctorId,
      used: false,
      pharmacistId: null,
      usedAt: null
    });

    return prescription;
  }

  @Post('patientless')
  @UseGuards(DoctorGuard)
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
      pharmacistId: null,
      usedAt: null
    });

    return prescription;
  }


}
