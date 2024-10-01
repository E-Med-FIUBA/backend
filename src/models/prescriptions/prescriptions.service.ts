import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PrescriptionDTO } from './dto/prescription.dto';
import { ChildSide, Prescription } from '@prisma/client';
import { poseidon1, poseidon2, poseidon3, poseidon9 } from 'poseidon-lite';
import * as snarkjs from 'snarkjs';

const keyLength = 4; // key length in bits

const padArray = <T>(arr: Array<T>, length: number, paddingValue: T) => {
  return arr.concat(Array(length - arr.length).fill(paddingValue));
};

const splitKey = (_key: number) => {
  const key = _key
    .toString(2)
    .split('')
    .map((x) => x === '1')
    .reverse();
  return padArray(key, keyLength, false);
};

@Injectable()
export class PrescriptionsService {
  private hash0 = (left: bigint, right: bigint) => poseidon2([left, right]);
  private hash1 = (key: bigint | number, value: bigint) =>
    poseidon3([key, value, 1n]);
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

  constructor(private prisma: PrismaService) {}

  async create(data: Omit<Prescription, 'id'>) {
    return this.prisma.$transaction(async (tx) => {
      const doctorRoot = await this.prisma.doctorNode.findFirst({
        where: {
          parent: null,
        },
      });

      if (!doctorRoot) {
        throw new Error('Doctor tree not initialized');
      }

      const doctorBinaryKey = splitKey(data.doctorId);
      let doctorCurrentNode = doctorRoot;
      const doctorSiblings = [];

      for (let i = 0; i < doctorBinaryKey.length; i++) {
        const side = doctorBinaryKey[i] ? ChildSide.RIGHT : ChildSide.LEFT;
        const sibling = await tx.doctorNode.findUnique({
          where: {
            unique_parent_side: {
              parent_id: doctorCurrentNode.id,
              side: side === ChildSide.RIGHT ? ChildSide.LEFT : ChildSide.RIGHT,
            },
          },
        });

        doctorSiblings.push(sibling ? BigInt(sibling.hash) : 0n);
        const child = await tx.doctorNode.findUnique({
          where: {
            unique_parent_side: {
              parent_id: doctorCurrentNode.id,
              side,
            },
          },
        });

        if (!child) {
          break;
        }
        doctorCurrentNode = child;
      }

      while (doctorSiblings.length < 4) {
        doctorSiblings.push(0n);
      }

      const doctor = await tx.doctor.findUnique({
        where: {
          id: data.doctorId,
        },
      });

      if (!doctor) {
        throw new Error('Doctor not found');
      }

      const prescription = await tx.prescription.create({
        data,
      });

      const hashedValue = this.hashPrescription(prescription);
      const hash = this.hash1(prescription.id, hashedValue);

      let root = await tx.prescriptionNode.findFirst({
        where: {
          parent: null,
        },
      });

      if (!root) {
        root = await tx.prescriptionNode.create({
          data: {
            hash: hash.toString(),
            prescription: {
              connect: {
                id: prescription.id,
              },
            },
          },
        });

        console.log({
          fnc: [1, 0],
          oldRoot: 0n,
          newRoot: hash,
          siblings: [0n, 0n, 0n, 0n],
          oldKey: 0,
          oldValue: 0,
          isOld0: 1,
          newKey: prescription.id,
          newValue: hashedValue,
          doctorRoot: BigInt(doctorRoot.hash),
          doctorSiblings: doctorSiblings,
          doctorKey: data.doctorId,
          doctorValue: poseidon3([doctor.id, doctor.license, doctor.userId]),
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
            newKey: prescription.id,
            newValue: hashedValue,
            doctorRoot: BigInt(doctorRoot.hash),
            doctorSiblings: doctorSiblings,
            doctorKey: data.doctorId,
            doctorValue: poseidon3([doctor.id, doctor.license, doctor.userId]),
          },
          'prescription_validation.wasm',
          'prescription_circuit_final.zkey',
        );

        return prescription;
      }

      const binaryKey = splitKey(prescription.id);
      let currentNode = root;

      let siblings = [];

      for (let i = 0; i < binaryKey.length; i++) {
        const side = binaryKey[i] ? ChildSide.RIGHT : ChildSide.LEFT;
        const sibling = await tx.prescriptionNode.findUnique({
          where: {
            unique_parent_side: {
              parent_id: currentNode.id,
              side: side === ChildSide.RIGHT ? ChildSide.LEFT : ChildSide.RIGHT,
            },
          },
        });

        siblings.push(sibling ? BigInt(sibling.hash) : 0n);
        const child = await tx.prescriptionNode.findUnique({
          where: {
            unique_parent_side: {
              parent_id: currentNode.id,
              side,
            },
          },
        });

        if (!child) {
          break;
        }
        currentNode = child;
      }

      currentNode = root;
      for (let i = 0; i < binaryKey.length; i++) {
        if (currentNode.key) {
          // collision
          // we need to split the node
          const collisionKey = splitKey(currentNode.key);
          const newParent = await tx.prescriptionNode.update({
            where: {
              id: currentNode.id,
            },
            data: {
              key: null,
              hash: '0',
              children: {
                create: [
                  {
                    hash: currentNode.hash,
                    key: currentNode.key,
                    side: collisionKey[i] ? ChildSide.RIGHT : ChildSide.LEFT,
                  },
                ],
              },
            },
          });
          currentNode = newParent;
        }

        const bit = binaryKey[i];
        const side = bit ? ChildSide.RIGHT : ChildSide.LEFT;
        const child = await tx.prescriptionNode.findUnique({
          where: {
            unique_parent_side: {
              parent_id: currentNode.id,
              side,
            },
          },
        });

        if (!child) {
          currentNode = await tx.prescriptionNode.create({
            data: {
              hash: hash.toString(),
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
        }

        currentNode = child;
      }

      currentNode = await tx.prescriptionNode.findUnique({
        where: {
          id: currentNode.parent_id,
        },
      });

      // // once created, we need to update the hash of the nodes
      let newRootHash = 0n;
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

        const leftHash = leftChild ? BigInt(leftChild.hash) : 0n;
        const rightHash = rightChild ? BigInt(rightChild.hash) : 0n;
        const currentHash = this.hash0(leftHash, rightHash);

        await tx.prescriptionNode.update({
          where: {
            id: currentNode.id,
          },
          data: {
            hash: currentHash.toString(),
          },
        });

        if (currentNode.parent_id === null) {
          newRootHash = currentHash;
          break;
        }

        currentNode = await tx.prescriptionNode.findUnique({
          where: {
            id: currentNode.parent_id,
          },
        });
      }

      siblings = padArray(siblings, 4, 0n);
      // // Generate the proof

      const latestValue = await tx.prescriptionNode.findFirst({
        where: {
          NOT: {
            key: prescription.id,
          },
        },
        orderBy: {
          id: 'desc',
        },
        include: {
          prescription: true,
        },
      });

      console.log({
        fnc: [1, 0],
        oldRoot: BigInt(root.hash),
        newRoot: newRootHash,
        siblings: siblings,
        oldKey: latestValue.key,
        oldValue: this.hashPrescription(latestValue.prescription),
        isOld0: 0,
        newKey: prescription.id,
        newValue: hashedValue,
      });
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        {
          fnc: [1, 0],
          oldRoot: BigInt(root.hash),
          newRoot: newRootHash,
          siblings: siblings,
          oldKey: latestValue.key,
          oldValue: this.hashPrescription(latestValue.prescription),
          isOld0: 0,
          newKey: prescription.id,
          newValue: hashedValue,
          doctorRoot: BigInt(doctorRoot.hash),
          doctorSiblings: doctorSiblings,
          doctorKey: data.doctorId,
          doctorValue: poseidon3([doctor.id, doctor.license, doctor.userId]),
        },
        'prescription_validation.wasm',
        'prescription_circuit_final.zkey',
      );

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
