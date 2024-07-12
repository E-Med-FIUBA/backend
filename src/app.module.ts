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

@Module({
  imports: [
    ConfigModule.forRoot(),
    DoctorsModule,
    DrugsModule,
    PatientsModule,
    PharmacistsModule,
    PrescriptionsModule,
    UsersModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
