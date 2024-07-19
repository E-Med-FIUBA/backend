import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { DrugsController } from './drugs.controller';
import { DrugsService } from './drugs.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
    UsersModule,
  ],
  controllers: [DrugsController],
  providers: [DrugsService, PrismaService],
})
export class DrugsModule {}
