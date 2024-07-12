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
import { DrugDTO } from './dto/drug.dto';
import { DrugsService } from './drugs.service';
import { AuthGuard } from '../../auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('drugs')
@Controller('drugs')
@UseGuards(AuthGuard)
export class DrugsController {
  constructor(private drugsService: DrugsService) {}

  @Post()
  create(@Body() data: DrugDTO) {
    return this.drugsService.create(data);
  }

  @Get()
  findAll() {
    return this.drugsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.drugsService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: DrugDTO) {
    return this.drugsService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.drugsService.remove(+id);
  }
}
