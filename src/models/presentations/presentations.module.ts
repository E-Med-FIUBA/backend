import { Module } from '@nestjs/common';
import { PresentationsService } from './presentations.service';
import { PresentationsController } from './presentations.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [PresentationsController],
  providers: [PresentationsService, PrismaService],
  exports: [PresentationsService],
})
export class PresentationsModule {}
