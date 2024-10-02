import { Injectable } from '@nestjs/common';
import { ChildSide, Doctor, DoctorNode, PrismaClient } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { poseidon2, poseidon3 } from 'poseidon-lite';

const keyLength = 4; // key length in bits

const padArray = <T>(
  arr: Array<T>,
  length: number,
  paddingValue: T,
): Array<T> => {
  return arr.concat(Array(length - arr.length).fill(paddingValue));
};

const splitKey = (_key: number): boolean[] => {
  const key = _key
    .toString(2)
    .split('')
    .map((x) => x === '1')
    .reverse();
  return padArray(key, keyLength, false);
};

interface DoctorProofGenerationData {
  fnc: [number, number];
  oldRoot: bigint;
  newRoot: bigint;
  siblings: bigint[];
  oldKey: number;
  oldValue: bigint;
  isOld0: number;
  newKey: number;
  newValue: bigint;
}

@Injectable()
export class DoctorsTreeService {
  constructor(private readonly prisma: PrismaService) {}

  private hash0 = (left: bigint, right: bigint): bigint =>
    poseidon2([left, right]);

  private hash1 = (key: bigint | number, value: bigint): bigint =>
    poseidon3([key, value, 1n]);

  private hashDoctor = (doctor: Doctor): bigint =>
    poseidon3([doctor.id, doctor.license, doctor.userId]);

  async createNode(
    doctor: Doctor,
    tx: PrismaClient = this.prisma,
  ): Promise<DoctorProofGenerationData> {
    const root = await this.getRoot(tx);
    if (!root) {
      return this.createRoot(doctor, tx);
    }

    const hashedValue = this.hashDoctor(doctor);
    const hash = this.hash1(doctor.id, hashedValue);
    const latestValue = await this.getLatest(tx);
    const binaryKey = splitKey(doctor.id);
    const siblings = await this._getSiblings(root, binaryKey, tx);

    let currentNode = await this.insertNode(
      root,
      binaryKey,
      doctor.id,
      hash,
      tx,
    );
    currentNode = await this.findNodeById(currentNode.parent_id);
    const newRootHash = await this.updateHashes(currentNode, tx);

    return {
      fnc: [1, 0],
      oldRoot: BigInt(root.hash),
      newRoot: newRootHash,
      siblings: siblings,
      oldKey: latestValue.key,
      oldValue: this.hashDoctor(latestValue.doctor),
      isOld0: 0,
      newKey: doctor.id,
      newValue: hashedValue,
    };
  }

  async _getSiblings(
    root: DoctorNode,
    binaryKey: boolean[],
    tx: PrismaClient = this.prisma,
  ): Promise<bigint[]> {
    const siblings: bigint[] = [];
    let currentNode = root;

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

    return padArray(siblings, keyLength, 0n);
  }

  async getSiblings(
    binaryKey: boolean[],
    tx: PrismaClient = this.prisma,
  ): Promise<bigint[]> {
    const root = await this.getRoot(tx);
    if (!root) throw new Error('Root node not found');
    return this._getSiblings(root, binaryKey, tx);
  }

  async getLatest(tx: PrismaClient = this.prisma): Promise<
    DoctorNode & {
      doctor: Doctor;
    }
  > {
    return tx.doctorNode.findFirst({
      orderBy: {
        id: 'desc',
      },
      include: {
        doctor: true,
      },
    });
  }

  async getRoot(tx: PrismaClient = this.prisma): Promise<DoctorNode> {
    return tx.doctorNode.findFirst({
      where: {
        parent: null,
      },
    });
  }

  private async createRoot(
    doctor: Doctor,
    tx: PrismaClient = this.prisma,
  ): Promise<DoctorProofGenerationData> {
    const hashedValue = this.hashDoctor(doctor);
    const rootHash = this.hash1(doctor.id, hashedValue);
    await tx.doctorNode.create({
      data: {
        hash: rootHash.toString(),
        doctor: {
          connect: {
            id: doctor.id,
          },
        },
      },
    });

    return {
      fnc: [1, 0],
      oldRoot: 0n,
      newRoot: rootHash,
      siblings: [0n, 0n, 0n, 0n],
      oldKey: 0,
      oldValue: 0n,
      isOld0: 1,
      newKey: doctor.id,
      newValue: hashedValue,
    };
  }

  private async updateHashes(
    currentNode: DoctorNode,
    tx: PrismaClient = this.prisma,
  ): Promise<bigint> {
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
        return currentHash;
      }

      currentNode = await tx.doctorNode.findUnique({
        where: {
          id: currentNode.parent_id,
        },
      });
    }
  }

  private async insertNode(
    root: DoctorNode,
    binaryKey: boolean[],
    doctorId: number,
    hash: bigint,
    tx: PrismaClient = this.prisma,
  ): Promise<DoctorNode> {
    let currentNode = root;
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
                id: doctorId,
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

    return currentNode;
  }

  async findNodeById(id: number): Promise<DoctorNode> {
    return this.prisma.doctorNode.findUnique({ where: { id } });
  }

  async getChildren(parentId: number): Promise<DoctorNode[]> {
    return this.prisma.doctorNode.findMany({
      where: { parent_id: parentId },
    });
  }
}
