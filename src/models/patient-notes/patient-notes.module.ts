import { Module } from '@nestjs/common';
import { PatientNotesService } from './patient-notes.service';
import { PatientNotesController } from './patient-notes.controller';
import { PrismaService } from 'src/prisma.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
  ],
  controllers: [PatientNotesController],
  providers: [PatientNotesService, PrismaService],
})
export class PatientNotesModule {}
