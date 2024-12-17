import { Controller, Get, Param } from '@nestjs/common';
import { PresentationsService } from './presentations.service';

@Controller('presentations')
export class PresentationsController {
  constructor(private readonly presentationsService: PresentationsService) {}

  @Get()
  findAll() {
    return this.presentationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.presentationsService.findOne(+id);
  }
}
