import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { PatientsModule } from '../patients/patients.module';
import { UsersModule } from '../users/users.module';
import { DoctorsTreeService } from 'src/doctors-tree/doctors-tree.service';
import { DoctorsTreeModule } from 'src/doctors-tree/doctors-tree.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
    PatientsModule,
    UsersModule,
    DoctorsTreeModule,
  ],
  controllers: [DoctorsController],
  providers: [DoctorsService, DoctorsTreeService, PrismaService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
