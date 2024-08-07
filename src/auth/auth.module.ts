import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { DoctorsModule } from '../models/doctors/doctors.module';
import { UsersModule } from '../models/users/users.module';
import { AuthService } from './auth.service';
import { PharmacistsModule } from '../models/pharmacists/pharmacists.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DoctorsModule,
    UsersModule,
    PharmacistsModule,
  ],
  exports: [],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
