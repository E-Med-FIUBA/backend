import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { UsersModule } from '../users/users.module';
import { PrescriptionsTreeModule } from 'src/models/prescriptions-tree/prescriptions-tree.module';
import { DoctorsTreeModule } from 'src/models/doctors-tree/doctors-tree.module';
import { DoctorsTreeService } from 'src/models/doctors-tree/doctors-tree.service';
import { PrescriptionsTreeService } from 'src/models/prescriptions-tree/prescriptions-tree.service';
import { ContractModule } from '../contract/contract.module';
import { ContractService } from '../contract/contract.service';
import { MailingModule } from 'src/mailing/mailing.module';
import { InsuranceModule } from '../insurance/insurance.module';
import { InsuranceService } from '../insurance/insurance.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
    UsersModule,
    DoctorsTreeModule,
    PrescriptionsTreeModule,
    ContractModule,
    InsuranceModule,
    MailingModule,
  ],
  controllers: [PrescriptionsController],
  providers: [
    PrescriptionsService,
    ContractService,
    DoctorsTreeService,
    PrescriptionsTreeService,
    InsuranceService,
    PrismaService,
  ],
})
export class PrescriptionsModule {}
