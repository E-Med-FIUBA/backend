import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { PatientsModule } from '../patients/patients.module';
import { UsersModule } from '../users/users.module';
import { ContractModule } from '../contract/contract.module';
import { ContractService } from '../contract/contract.service';
import { DoctorsTreeModule } from '../doctors-tree/doctors-tree.module';
import { SignatureModule } from '../../signature/signature.module';
import { MailingModule } from '../../mailing/mailing.module';
import { DoctorsTreeService } from '../doctors-tree/doctors-tree.service';
import { MailingService } from '../../mailing/mailing.service';

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
