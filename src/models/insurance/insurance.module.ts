import { Module } from '@nestjs/common';
import { InsuranceService } from './insurance.service';
import { SpecialtyController } from './insurance.controller';
import { UsersModule } from '../users/users.module';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [UsersModule],
  controllers: [SpecialtyController],
  providers: [InsuranceService, PrismaService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
