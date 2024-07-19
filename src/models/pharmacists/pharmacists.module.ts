import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { PharmacistsController } from './pharmacists.controller';
import { PharmacistsService } from './pharmacists.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
    UsersModule,
  ],
  controllers: [PharmacistsController],
  providers: [PharmacistsService, PrismaService],
  exports: [PharmacistsService],
})
export class PharmacistsModule {}
