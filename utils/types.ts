import { PrismaClient } from '@prisma/client';

export type PrismaTransactionalClient = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];

export interface UpdateProofGenerationData {
  oldRoot: bigint;
  newRoot: bigint;
  siblings: bigint[];
  oldKey: number;
  oldValue: bigint;
  key: number;
  doctorId: number;
  presentationId: number;
  patientId: number;
  quantity: number;
  emitedAt: number;
  [key: string]: any;
}
