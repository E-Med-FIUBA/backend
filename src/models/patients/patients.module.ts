import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
    UsersModule,
  ],
  controllers: [PatientsController],
  providers: [PatientsService, PrismaService],
  exports: [PatientsService]
})
export class PatientsModule {}
