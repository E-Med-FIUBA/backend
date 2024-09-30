import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PrescriptionDTO } from './dto/prescription.dto';
import { ChildSide, Prescription } from '@prisma/client';

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
            hash: '0',
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
          child = await tx.prescriptionNode.findFirst({
            where: {
              parent_id: currentNode.id,
              side: ChildSide.LEFT,
            },
          });
        } else {
          // we need to go right
          child = await tx.prescriptionNode.findFirst({
            where: {
              parent_id: currentNode.id,
              side: ChildSide.RIGHT,
            },
          });
        }

        if (!child) {
          // we need to create a new node
          currentNode = await tx.prescriptionNode.create({
            data: {
              hash: '0',
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
              hash: '0',
              children: {
                create: [
                  {
                    hash: '0',
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

      // once created, we need to update the hash of the nodes
      console.log('currentNode', currentNode);

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
