import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PharmacistsService } from './pharmacists.service';
import { Pharmacist } from '@prisma/client';
import { PharmacistDTO } from './dto/pharmacist.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('pharmacists')
@Controller('pharmacists')
@UseGuards(AuthGuard)
export class PharmacistsController {
  constructor(private pharmacistsService: PharmacistsService) {}

  @Get()
  findAll(): Promise<Pharmacist[]> {
    return this.pharmacistsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Pharmacist> {
    return this.pharmacistsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() pharmacistDTO: PharmacistDTO,
  ): Promise<Pharmacist> {
    return this.pharmacistsService.update(id, pharmacistDTO);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<Pharmacist> {
    return this.pharmacistsService.remove(id);
  }
}
