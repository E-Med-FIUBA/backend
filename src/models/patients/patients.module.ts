import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { UsersModule } from '../users/users.module';
import { PatientNotesModule } from '../patient-notes/patient-notes.module';
import { PatientNotesService } from '../patient-notes/patient-notes.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
    UsersModule,
    PatientNotesModule,
  ],
  controllers: [PatientsController],
  providers: [PatientsService, PrismaService, PatientNotesService],
  exports: [PatientsService],
})
export class PatientsModule {}
