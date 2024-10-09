import { Module } from '@nestjs/common';
import { InsuranceService } from './insurance.service';
import { SpecialtyController } from './insurance.controller';
import { PrismaService } from 'src/prisma.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [SpecialtyController],
  providers: [InsuranceService, PrismaService],
})
export class InsuranceModule {}
