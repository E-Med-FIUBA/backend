import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UsersModule } from '../users/users.module';
import { SignatureController } from './signature.controller';
import { SignatureService } from './signature.service';
import { DoctorsModule } from '../doctors/doctors.module';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';

@Module({
  imports: [DoctorsModule, PrescriptionsModule],
  controllers: [SignatureController],
  providers: [SignatureService, PrismaService],
})
export class SignatureModule { }
