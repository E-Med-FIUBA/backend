import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PrescriptionDTO } from './dto/prescription.dto';
import { ChildSide, Prescription } from '@prisma/client';
import { poseidon2, poseidon9 } from 'poseidon-lite';
import { Decimal } from '@prisma/client/runtime/library';

const keyLength = 4; // key length in bits

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Omit<Prescription, 'id'>) {
    return this.prisma.$transaction(async (tx) => {
      const prescription = await tx.prescription.create({
        data,
      });

      let root = await tx.prescriptionNode.findFirst({
        where: {
          parent: null,
        },
      });

      if (!root) {
        root = await tx.prescriptionNode.create({
          data: {
            hash: new Decimal(0),
          },
        });
      }

      const binaryKey = prescription.id.toString(2).padStart(keyLength, '0');

      let currentNode = root;
      for (let i = 0; i < binaryKey.length; i++) {
        const bit = binaryKey[i];
        let child = null;
        const side = bit === '0' ? ChildSide.LEFT : ChildSide.RIGHT;
        if (side === ChildSide.LEFT) {
          // we need to go left
          child = await tx.prescriptionNode.findUnique({
            where: {
              unique_parent_side: {
                parent_id: currentNode.id,
                side: ChildSide.LEFT,
              },
            },
          });
        } else {
          // we need to go right
          child = await tx.prescriptionNode.findUnique({
            where: {
              unique_parent_side: {
                parent_id: currentNode.id,
                side: ChildSide.RIGHT,
              },
            },
          });
        }

        if (!child) {
          // we need to create a new node
          const hash = poseidon9([
            prescription.id,
            prescription.doctorId,
            prescription.drugId,
            prescription.patientId,
            prescription.quantity,
            prescription.startDate.getTime(),
            prescription.endDate.getTime(),
            prescription.duration,
            prescription.frequency,
          ]);
          currentNode = await tx.prescriptionNode.create({
            data: {
              hash: new Decimal(hash.toString()),
              prescription: {
                connect: {
                  id: prescription.id,
                },
              },
              parent: {
                connect: {
                  id: currentNode.id,
                },
              },
              side,
            },
          });
          break;
        } else if (child.key) {
          // collision
          // we need to split the node
          const collisionKey = child.key.toString(2).padStart(keyLength, '0');
          const newParent = await tx.prescriptionNode.update({
            where: {
              id: child.id,
            },
            data: {
              key: null,
              hash: new Decimal(0),
              children: {
                create: [
                  {
                    hash: child.hash,
                    key: child.key,
                    side:
                      collisionKey.charAt(i + 1) === '0'
                        ? ChildSide.LEFT
                        : ChildSide.RIGHT,
                  },
                ],
              },
            },
          });

          currentNode = newParent;
          continue;
        }

        currentNode = child;
      }

      currentNode = await tx.prescriptionNode.findUnique({
        where: {
          id: currentNode.parent_id,
        },
      });

      // once created, we need to update the hash of the nodes
      while (currentNode) {
        const leftChild = await tx.prescriptionNode.findUnique({
          where: {
            unique_parent_side: {
              parent_id: currentNode.id,
              side: ChildSide.LEFT,
            },
          },
        });

        const rightChild = await tx.prescriptionNode.findUnique({
          where: {
            unique_parent_side: {
              parent_id: currentNode.id,
              side: ChildSide.RIGHT,
            },
          },
        });

        const leftHash = BigInt(leftChild?.hash.toNumber() || 0);
        const rightHash = BigInt(rightChild?.hash.toNumber() || 0);
        const currentHash = poseidon2([leftHash, rightHash]);

        await tx.prescriptionNode.update({
          where: {
            id: currentNode.id,
          },
          data: {
            hash: new Decimal(currentHash.toString()),
          },
        });

        if (!currentNode.parent_id) {
          break;
        }

        currentNode = await tx.prescriptionNode.findUnique({
          where: {
            id: currentNode.parent_id,
          },
        });
      }

      return prescription;
    });
  }

  findAll() {
    return this.prisma.prescription.findMany();
  }

  findOne(id: number) {
    return this.prisma.prescription.findUnique({
      where: {
        id,
      },
    });
  }

  update(id: number, data: PrescriptionDTO) {
    return this.prisma.prescription.update({
      where: {
        id,
      },
      data,
    });
  }

  remove(id: number) {
    return this.prisma.prescription.delete({
      where: {
        id,
      },
    });
  }
}
