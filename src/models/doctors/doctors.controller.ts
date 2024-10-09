import {
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
import { AuthGuard } from '../../auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { DoctorUpdateDTO } from './dto/doctor-update.dto';

@ApiTags('doctors')
@Controller('doctors')
@UseGuards(AuthGuard)
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) {}
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.doctorsService.findOne(id);
  }

  @Put('me')
  updateMe(@Req() req, @Body() data: DoctorUpdateDTO) {
    const userId = req.user.id;
    console.log(data);

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
