import { Module } from '@nestjs/common';
import { PatientNotesService } from './patient-notes.service';
import { PatientNotesController } from './patient-notes.controller';
import { PrismaService } from 'src/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
    UsersModule,
  ],
  controllers: [PatientNotesController],
  providers: [PatientNotesService, UsersService, PrismaService],
})
export class PatientNotesModule {}
