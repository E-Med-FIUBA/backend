import { Injectable } from '@nestjs/common';
import { Doctor } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { poseidon3 } from 'poseidon-lite';
import { TreeService } from 'src/tree.service';

@Injectable()
export class DoctorsTreeService extends TreeService {
  constructor(protected readonly prisma: PrismaService) {
    super('doctorNode', 'doctor', prisma);
  }

  hashData = (doctor: Doctor): bigint =>
    poseidon3([doctor.id, doctor.license, doctor.userId]);
}
