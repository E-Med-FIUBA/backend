import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DoctorsModule } from './models/doctors/doctors.module';
import { PatientsModule } from './models/patients/patients.module';
import { PharmacistsModule } from './models/pharmacists/pharmacists.module';
import { PrescriptionsModule } from './models/prescriptions/prescriptions.module';
import { DrugsModule } from './models/drugs/drugs.module';
import { UsersModule } from './models/users/users.module';
import { AuthModule } from './auth/auth.module';
import { DoctorsTreeModule } from './models/doctors-tree/doctors-tree.module';
import { PrescriptionsTreeModule } from './models/prescriptions-tree/prescriptions-tree.module';
import { ContractModule } from './models/contract/contract.module';
import { UsersController } from './models/users/users.controller';
import { SpecialtyModule } from './models/specialty/specialty.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DoctorsModule,
    DrugsModule,
    PatientsModule,
    PharmacistsModule,
    PrescriptionsModule,
    UsersModule,
    AuthModule,
    DoctorsTreeModule,
    PrescriptionsTreeModule,
    ContractModule,
    SpecialtyModule,
  ],
  controllers: [AppController, UsersController],
  providers: [AppService],
})
export class AppModule {}
