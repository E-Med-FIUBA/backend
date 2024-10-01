import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PrescriptionDTO } from './dto/prescription.dto';
import { ChildSide, Prescription } from '@prisma/client';
import { poseidon1, poseidon2, poseidon3, poseidon9 } from 'poseidon-lite';
import { Decimal } from '@prisma/client/runtime/library';
import * as snarkjs from 'snarkjs';

const keyLength = 4; // key length in bits

@Injectable()
export class PrescriptionsService {
  private precalculatedHashes: Map<number, bigint> = new Map();
  private hash0 = (left: bigint, right: bigint) => poseidon2([left, right]);
  private hash1 = (key: bigint, value: bigint) => poseidon3([key, value, 1n]);
  private hashPrescription = (prescription: Prescription) =>
    poseidon9([
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

  constructor(private prisma: PrismaService) {
    for (let i = 0; i < 16; i++) {
      const previous = i === 0 ? 0n : this.precalculatedHashes.get(i - 1);
      this.precalculatedHashes.set(i, poseidon1([previous]));
    }
    console.log(this.precalculatedHashes);
  }

  async create(data: Omit<Prescription, 'id'>) {
    return this.prisma.$transaction(async (tx) => {
      const prescription = await tx.prescription.create({
        data,
      });

      const hashedValue = this.hashPrescription(prescription);
      const hash = this.hash1(0n, hashedValue);

      let root = await tx.prescriptionNode.findFirst({
        where: {
          parent: null,
        },
      });

      if (!root) {
        root = await tx.prescriptionNode.create({
          data: {
            hash: new Decimal(hash.toString()),
            prescription: {
              connect: {
                id: prescription.id,
              },
            },
          },
        });

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
          {
            fnc: [1, 0],
            oldRoot: 0n,
            newRoot: hash,
            siblings: [0n, 0n, 0n, 0n],
            oldKey: 0,
            oldValue: 0,
            isOld0: 1,
            newKey: 0n,
            newValue: hashedValue,
          },
          'prescription_validation.wasm',
          'circuit_final.zkey',
        );

        console.log(proof, publicSignals);
        return prescription;
      }

      const binaryKey = prescription.id
        .toString(2)
        .split('')
        .map((x) => x === '1')
        .reverse();

      let currentNode = root;
      for (let i = 0; i < binaryKey.length; i++) {
        const bit = binaryKey[i];
        let child = null;
        const side = bit ? ChildSide.LEFT : ChildSide.RIGHT;
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
          const collisionKey = child.key.toString(2).split('').reverse();
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
                    side: collisionKey[i + 1]
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

      const siblings = [];
      let currentSide = currentNode.side;
      currentNode = await tx.prescriptionNode.findUnique({
        where: {
          id: currentNode.parent_id,
        },
      });

      // once created, we need to update the hash of the nodes
      let newRootHash = BigInt(0);
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
        const currentHash = this.hash0(leftHash, rightHash);

        await tx.prescriptionNode.update({
          where: {
            id: currentNode.id,
          },
          data: {
            hash: new Decimal(currentHash.toString()),
          },
        });

        siblings.push(currentSide === ChildSide.LEFT ? rightHash : leftHash);

        if (!currentNode.parent_id) {
          newRootHash = currentHash;
          break;
        }

        currentSide = currentNode.side;
        currentNode = await tx.prescriptionNode.findUnique({
          where: {
            id: currentNode.parent_id,
          },
        });
      }

      while (siblings.length < 4) {
        siblings.push(0n);
      }

      // TODO: While updating the hash of the nodes, save the siblings of the current node to generate the proof

      // Generate the proof
      console.log({
        fnc: [1, 0],
        oldRoot: BigInt(root.hash.toNumber()),
        newRoot: newRootHash,
        siblings: siblings,
        oldKey: 0,
        oldValue: 0,
        isOld0: 1,
        newKey: prescription.id,
        newValue: poseidon9([
          prescription.id,
          prescription.doctorId,
          prescription.drugId,
          prescription.patientId,
          prescription.quantity,
          prescription.startDate.getTime(),
          prescription.endDate.getTime(),
          prescription.duration,
          prescription.frequency,
        ]),
      });

      // const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      //   {
      //     fnc: [1, 0],
      //     oldRoot: BigInt(root.hash.toNumber()),
      //     newRoot: newRootHash,
      //     siblings: siblings,
      //     oldKey: 0,
      //     oldValue: 0,
      //     isOld0: 1,
      //     newKey: prescription.id,
      //     newValue: hash,
      //   },
      //   'prescription_validation.wasm',
      //   'circuit_final.zkey',
      // );

      // console.log(proof, publicSignals);

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
