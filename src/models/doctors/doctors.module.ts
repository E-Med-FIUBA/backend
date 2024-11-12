import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { PatientsModule } from '../patients/patients.module';
import { UsersModule } from '../users/users.module';
import { DoctorsTreeService } from 'src/models/doctors-tree/doctors-tree.service';
import { DoctorsTreeModule } from 'src/models/doctors-tree/doctors-tree.module';
import { ContractModule } from '../contract/contract.module';
import { ContractService } from '../contract/contract.service';
import { SignatureModule } from 'src/signature/signature.module';
import { MailingModule } from 'src/mailing/mailing.module';
import { MailingService } from 'src/mailing/mailing.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
    PatientsModule,
    UsersModule,
    DoctorsTreeModule,
    ContractModule,
    SignatureModule,
    MailingModule,
  ],
  controllers: [DoctorsController],
  providers: [
    DoctorsService,
    DoctorsTreeService,
    ContractService,
    PrismaService,
    MailingService,
  ],
  exports: [DoctorsService],
})
export class DoctorsModule {}
