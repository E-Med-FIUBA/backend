import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { UsersModule } from '../users/users.module';
import { PrescriptionsTreeModule } from 'src/prescriptions-tree/prescriptions-tree.module';
import { DoctorsTreeModule } from 'src/doctors-tree/doctors-tree.module';
import { DoctorsTreeService } from 'src/doctors-tree/doctors-tree.service';
import { PrescriptionsTreeService } from 'src/prescriptions-tree/prescriptions-tree.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
    UsersModule,
    DoctorsTreeModule,
    PrescriptionsTreeModule,
  ],
  controllers: [PrescriptionsController],
  providers: [
    PrescriptionsService,
    PrismaService,
    DoctorsTreeService,
    PrescriptionsTreeService,
  ],
})
export class PrescriptionsModule {}
