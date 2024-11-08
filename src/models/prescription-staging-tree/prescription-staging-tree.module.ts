import { Module } from '@nestjs/common';
import { PrescriptionStagingTreeService } from './prescription-staging-tree.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
  ],
  providers: [PrescriptionStagingTreeService, PrismaService],
})
export class PrescriptionStagingTreeModule {}
