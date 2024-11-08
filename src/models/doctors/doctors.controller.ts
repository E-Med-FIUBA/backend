import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { DoctorUpdateDTO } from './dto/doctor-update.dto';
import { User } from '@prisma/client';
import { SignatureService } from 'src/signature/signature.service';
import { DoctorGuard } from 'src/auth/guards/doctor.guard';

@ApiTags('doctors')
@Controller('doctors')
@UseGuards(DoctorGuard)
export class DoctorsController {
  constructor(private doctorsService: DoctorsService, private signatureService: SignatureService) { }

  @Get('private-key')
  public async getPrivateKey(@Req() req: Request & { user: User }): Promise<{ privateKey: string }> {
    const user = req.user;

    const doctor = await this.doctorsService.getDoctorByUserId(user.id);

    if (!doctor) {
      throw new BadRequestException('Doctor not found');
    }

    return { privateKey: await this.signatureService.getPrivateKeyPEM(doctor.id) };
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.doctorsService.findOne(id);
  }

  @Put('me')
  updateMe(@Req() req, @Body() data: DoctorUpdateDTO) {
    const userId = req.user.id;
    return this.doctorsService.update(userId, data);
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
