import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { PharmacistsController } from './pharmacists.controller';
import { PharmacistsService } from './pharmacists.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
  ],
  controllers: [PharmacistsController],
  providers: [PharmacistsService, PrismaService],
})
export class PharmacistsModule {}
