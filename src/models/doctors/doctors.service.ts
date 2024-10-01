import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ChildSide, Doctor } from '@prisma/client';
import { DoctorDTO } from './dto/doctor.dto';
import { PatientsService } from '../patients/patients.service';
import { poseidon2, poseidon3 } from 'poseidon-lite';
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
export class DoctorsService {
  private hash0 = (left: bigint, right: bigint) => poseidon2([left, right]);
  private hash1 = (key: bigint | number, value: bigint) =>
    poseidon3([key, value, 1n]);
  private hashDoctor = (doctor: Doctor) =>
    poseidon3([doctor.id, doctor.license, doctor.userId]);

  constructor(
    private prisma: PrismaService,
    private patientsService: PatientsService,
  ) {}

  create(data: Omit<Doctor, 'id'>) {
    return this.prisma.$transaction(async (tx) => {
      const doctor = await tx.doctor.create({
        data,
      });

      const hashedValue = this.hashDoctor(doctor);
      const hash = this.hash1(doctor.id, hashedValue);
      console.log('hashedValue', hashedValue, 'id', doctor.id);
      console.log('hash', hash);

      let root = await tx.doctorNode.findFirst({
        where: {
          parent: null,
        },
      });

      if (!root) {
        root = await tx.doctorNode.create({
          data: {
            hash: hash.toString(),
            doctor: {
              connect: {
                id: doctor.id,
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
            newKey: doctor.id,
            newValue: hashedValue,
          },
          'doctor_validation.wasm',
          'doctor_circuit_final.zkey',
        );

        return doctor;
      }

      const binaryKey = splitKey(doctor.id);
      let currentNode = root;

      let siblings = [];

      for (let i = 0; i < binaryKey.length; i++) {
        const side = binaryKey[i] ? ChildSide.RIGHT : ChildSide.LEFT;
        const sibling = await tx.doctorNode.findUnique({
          where: {
            unique_parent_side: {
              parent_id: currentNode.id,
              side: side === ChildSide.RIGHT ? ChildSide.LEFT : ChildSide.RIGHT,
            },
          },
        });

        siblings.push(sibling ? BigInt(sibling.hash) : 0n);
        const child = await tx.doctorNode.findUnique({
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
          const newParent = await tx.doctorNode.update({
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
        const child = await tx.doctorNode.findUnique({
          where: {
            unique_parent_side: {
              parent_id: currentNode.id,
              side,
            },
          },
        });

        if (!child) {
          currentNode = await tx.doctorNode.create({
            data: {
              hash: hash.toString(),
              doctor: {
                connect: {
                  id: doctor.id,
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

      currentNode = await tx.doctorNode.findUnique({
        where: {
          id: currentNode.parent_id,
        },
      });

      // // once created, we need to update the hash of the nodes
      let newRootHash = 0n;
      while (currentNode) {
        const leftChild = await tx.doctorNode.findUnique({
          where: {
            unique_parent_side: {
              parent_id: currentNode.id,
              side: ChildSide.LEFT,
            },
          },
        });

        const rightChild = await tx.doctorNode.findUnique({
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

        await tx.doctorNode.update({
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

        currentNode = await tx.doctorNode.findUnique({
          where: {
            id: currentNode.parent_id,
          },
        });
      }

      siblings = padArray(siblings, 4, 0n);
      // // Generate the proof

      const latestValue = await tx.doctorNode.findFirst({
        where: {
          NOT: {
            key: doctor.id,
          },
        },
        orderBy: {
          id: 'desc',
        },
        include: {
          doctor: true,
        },
      });

      console.log({
        fnc: [1, 0],
        oldRoot: BigInt(root.hash),
        newRoot: newRootHash,
        siblings: siblings,
        oldKey: latestValue.key,
        oldValue: this.hashDoctor(latestValue.doctor),
        isOld0: 0,
        newKey: doctor.id,
        newValue: hashedValue,
      });
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        {
          fnc: [1, 0],
          oldRoot: BigInt(root.hash),
          newRoot: newRootHash,
          siblings: siblings,
          oldKey: latestValue.key,
          oldValue: this.hashDoctor(latestValue.doctor),
          isOld0: 0,
          newKey: doctor.id,
          newValue: hashedValue,
        },
        'doctor_validation.wasm',
        'doctor_circuit_final.zkey',
      );

      // console.log(proof, publicSignals);

      return doctor;
    });
  }

  findAll(): Promise<Doctor[]> {
    return this.prisma.doctor.findMany();
  }

  findOne(id: number): Promise<Doctor> {
    return this.prisma.doctor.findUnique({
      where: {
        id,
      },
    });
  }

  update(id: number, data: DoctorDTO): Promise<Doctor> {
    return this.prisma.doctor.update({
      where: {
        id,
      },
      data,
    });
  }

  remove(id: number): Promise<Doctor> {
    return this.prisma.doctor.delete({
      where: {
        id,
      },
    });
  }

  getDoctorsPatients(id: number) {
    return this.patientsService.findDoctorPatients(id);
  }
}
