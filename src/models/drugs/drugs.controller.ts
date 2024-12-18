import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DrugDTO } from './dto/drug.dto';
import { DrugsService } from './drugs.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { PharmacistGuard } from 'src/auth/guards/pharmacist.guard';
import { ReqUser } from 'src/utils/req_user';

@ApiTags('drugs')
@Controller('drugs')
@UseGuards(AuthGuard)
export class DrugsController {
  constructor(private drugsService: DrugsService) {}

  // @Post()
  // create(@Body() data: DrugDTO) {
  //   return this.drugsService.create(data);
  // }

  @Get()
  findAll() {
    return this.drugsService.findAll();
  }

  @Get('search')
  search(
    @Query('query') query: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    page = page || 1;
    limit = limit || 10;
    return this.drugsService.search(query, page, limit);
  }

  @Get('metrics')
  @UseGuards(PharmacistGuard)
  getMetrics(@Req() req: ReqUser) {
    return this.drugsService.getMetrics(req.user.pharmacist.id);
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
