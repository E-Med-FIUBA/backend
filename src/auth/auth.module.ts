import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { DoctorsModule } from '../models/doctors/doctors.module';
import { UsersModule } from '../models/users/users.module';

@Module({
  imports: [ConfigModule.forRoot(), DoctorsModule, UsersModule],
  exports: [],
  providers: [],
  controllers: [AuthController],
})
export class AuthModule {}
