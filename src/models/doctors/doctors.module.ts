import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { PatientsModule } from '../patients/patients.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
    PatientsModule,
    UsersModule
  ],
  controllers: [DoctorsController],
  providers: [DoctorsService, PrismaService],
})
export class DoctorsModule {}
