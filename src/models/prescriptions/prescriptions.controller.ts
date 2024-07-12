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
  UseGuards,
} from '@nestjs/common';
import { PrescriptionDTO } from './dto/prescription.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('prescriptions')
@Controller('prescriptions')
@UseGuards(AuthGuard)
export class PrescriptionsController {
  constructor(private prescriptionsService: PrescriptionsService) {}

  @Get()
  findAll(): Promise<Prescription[]> {
    return this.prescriptionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Prescription> {
    return this.prescriptionsService.findOne(id);
  }

  @Post()
  create(@Body() prescriptionDTO: PrescriptionDTO): Promise<Prescription> {
    return this.prescriptionsService.create(prescriptionDTO);
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
