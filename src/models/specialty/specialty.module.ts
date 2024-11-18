import { Module } from '@nestjs/common';
import { SpecialtyService } from './specialty.service';
import { SpecialtyController } from './specialty.controller';
import { UsersModule } from '../users/users.module';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [UsersModule],
  controllers: [SpecialtyController],
  providers: [SpecialtyService, PrismaService],
})
export class SpecialtyModule {}
