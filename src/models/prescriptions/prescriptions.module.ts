import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { UsersModule } from '../users/users.module';
import { ContractModule } from '../contract/contract.module';
import { ContractService } from '../contract/contract.service';
import { PatientsModule } from '../patients/patients.module';
import { PatientsService } from '../patients/patients.service';
import { DoctorsTreeModule } from '../doctors-tree/doctors-tree.module';
import { PrescriptionsTreeModule } from '../prescriptions-tree/prescriptions-tree.module';
import { MailingModule } from '../../mailing/mailing.module';
import { SignatureModule } from '../../signature/signature.module';
import { PrescriptionsTreeService } from '../prescriptions-tree/prescriptions-tree.service';
import { DoctorsTreeService } from '../doctors-tree/doctors-tree.service';
import { DoctorsModule } from '../doctors/doctors.module';
import { InsuranceModule } from '../insurance/insurance.module';
import { PresentationsModule } from '../presentations/presentations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
    UsersModule,
    DoctorsTreeModule,
    PrescriptionsTreeModule,
    ContractModule,
    PatientsModule,
    MailingModule,
    SignatureModule,
    DoctorsModule,
    InsuranceModule,
    PresentationsModule,
  ],
  controllers: [PrescriptionsController],
  providers: [
    PrescriptionsService,
    ContractService,
    DoctorsTreeService,
    PrescriptionsTreeService,
    PatientsService,
    PrismaService,
  ],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
