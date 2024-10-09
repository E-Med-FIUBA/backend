import { Module } from '@nestjs/common';
import { SpecialtyService } from './specialty.service';
import { SpecialtyController } from './specialty.controller';
import { PrismaService } from 'src/prisma.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [SpecialtyController],
  providers: [SpecialtyService, PrismaService],
})
export class SpecialtyModule {}
