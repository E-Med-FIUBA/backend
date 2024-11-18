import { Module } from '@nestjs/common';
import { SignatureService } from './signature.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [SignatureService, PrismaService],
  exports: [SignatureService],
})
export class SignatureModule {}
