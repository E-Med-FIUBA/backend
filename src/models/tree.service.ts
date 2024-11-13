import { ChildSide } from '@prisma/client';
import { poseidon2, poseidon3 } from 'poseidon-lite';
import { PrismaService } from '../prisma.service';
import { PrismaTransactionalClient } from 'utils/types';
import { NotFoundException } from '@nestjs/common';

const keyLength = 24; // key length in bits - TODO: change this to a higher value. The number of available keys is 2^keyLength

const padArray = <T>(
  arr: Array<T>,
  length: number,
  paddingValue: T,
): Array<T> => {
  return arr.concat(Array(length - arr.length).fill(paddingValue));
};

export const splitKey = (_key: number): boolean[] => {
  const key = _key
    .toString(2)
    .split('')
    .map((x) => x === '1')
    .reverse();
  return padArray(key, keyLength, false);
};

export interface CreationProofGenerationData {
  oldRoot: bigint;
  newRoot: bigint;
  siblings: bigint[];
  oldKey: number;
  oldValue: bigint;
  isOld0: number;
  newKey: number;
  newValue: bigint;
  [key: string]: any;
}

export interface InclusionProofGenerationData {
  root: bigint;
  siblings: bigint[];
  key: number;
  value: bigint;
  [key: string]: any;
}

interface NodeData {
  id: number;
}

interface Node {
  id: number;
  hash: string;
  key: number | null;
  parent_id: number | null;
  side: ChildSide | null;
}

export class TreeService {
  constructor(
    private readonly nodeRepositoryName: string,
    private readonly entityName: string,
    protected readonly prisma: PrismaService,
  ) {
    if (this.constructor == TreeService) {
      throw new Error("Abstract classes can't be instantiated.");
    }
  }

  protected hash0 = (left: bigint, right: bigint): bigint =>
    poseidon2([left, right]);

  protected hash1 = (key: bigint | number, value: bigint): bigint =>
    poseidon3([key, value, 1n]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected hashData = (data: NodeData): bigint => {
    throw new Error('Not implemented');
  };

  async createNode(
    nodeData: NodeData,
    tx: PrismaTransactionalClient = this.prisma,
  ): Promise<CreationProofGenerationData> {
    const root = await this.getRoot(tx, true);
    if (!root) {
      return this.createRoot(nodeData, tx);
    }

    const hashedValue = this.hashData(nodeData);
    const hash = this.hash1(nodeData.id, hashedValue);

    const binaryKey = splitKey(nodeData.id);
    const { siblings, oldNode } = await this.getSiblingsAndOldNode(
      root,
      binaryKey,
      tx,
    );

    let currentNode = await this.insertNode(
      root,
      binaryKey,
      nodeData.id,
      hash,
      tx,
    );
    currentNode = await this.getNode(currentNode.parent_id, tx);
    const newRootHash = await this.updateHashes(currentNode, tx);

    return {
      oldRoot: BigInt(root.hash),
      newRoot: newRootHash,
      siblings: siblings,
      oldKey: oldNode.key,
      oldValue: this.hashData(oldNode[this.entityName]),
      isOld0: 0,
      newKey: nodeData.id,
      newValue: hashedValue,
    };
  }

  protected async getSiblingsAndOldNode(
    root: Node,
    binaryKey: boolean[],
    tx: PrismaTransactionalClient = this.prisma,
  ): Promise<{
    siblings: bigint[];
    oldNode: Node;
  }> {
    const siblings: bigint[] = [];
    let currentNode = root;

    for (let i = 0; i < binaryKey.length; i++) {
      const side = binaryKey[i] ? ChildSide.RIGHT : ChildSide.LEFT;

      const sibling = await this.getChild(
        currentNode.id,
        side === ChildSide.LEFT ? ChildSide.RIGHT : ChildSide.LEFT,
        tx,
      );
      siblings.push(sibling ? BigInt(sibling.hash) : 0n);

      const child = await this.getChild(currentNode.id, side, tx);
      if (!child) {
        break;
      }

      currentNode = child;
      if (child.key) {
        break;
      }
    }

    return {
      siblings: padArray(siblings, keyLength, 0n),
      oldNode: await this.getNode(currentNode.id, tx, true),
    };
  }

  async getSiblings(
    key: number,
    tx: PrismaTransactionalClient = this.prisma,
  ): Promise<bigint[]> {
    const root = await this.getRoot(tx);
    if (!root) throw new Error('Root node not found');
    const binaryKey = splitKey(key);
    return this.getSiblingsAndOldNode(root, binaryKey, tx).then(
      ({ siblings }) => siblings,
    );
  }

  async getRoot(
    tx: PrismaTransactionalClient = this.prisma,
    includeData: boolean = false,
  ): Promise<Node | null> {
    return tx[this.nodeRepositoryName].findFirst({
      where: {
        parent: null,
      },
      include: {
        [this.entityName]: includeData,
      },
    });
  }

  private async createRoot(
    nodeData: NodeData,
    tx: PrismaTransactionalClient = this.prisma,
  ): Promise<CreationProofGenerationData> {
    const hashedValue = this.hashData(nodeData);
    const rootHash = this.hash1(nodeData.id, hashedValue);
    await tx[this.nodeRepositoryName].create({
      data: {
        hash: rootHash.toString(),
        [this.entityName]: {
          connect: {
            id: nodeData.id,
          },
        },
      },
    });

    return {
      oldRoot: 0n,
      newRoot: rootHash,
      siblings: Array(keyLength).fill(0n),
      oldKey: 0,
      oldValue: 0n,
      isOld0: 1,
      newKey: nodeData.id,
      newValue: hashedValue,
    };
  }

  protected async updateHashes(
    currentNode: Node,
    tx: PrismaTransactionalClient = this.prisma,
  ): Promise<bigint> {
    let currentHash = BigInt(currentNode.hash);
    while (currentNode) {
      const leftChild = await this.getChild(currentNode.id, ChildSide.LEFT, tx);
      const rightChild = await this.getChild(
        currentNode.id,
        ChildSide.RIGHT,
        tx,
      );

      const leftHash = leftChild ? BigInt(leftChild.hash) : 0n;
      const rightHash = rightChild ? BigInt(rightChild.hash) : 0n;
      currentHash = this.hash0(leftHash, rightHash);

      await tx[this.nodeRepositoryName].update({
        where: {
          id: currentNode.id,
        },
        data: {
          hash: currentHash.toString(),
        },
      });

      if (currentNode.parent_id === null) {
        break;
      }

      currentNode = await tx[this.nodeRepositoryName].findUnique({
        where: {
          id: currentNode.parent_id,
        },
      });
    }

    return currentHash;
  }

  private async insertNode(
    root: Node,
    binaryKey: boolean[],
    dataId: number,
    hash: bigint,
    tx: PrismaTransactionalClient = this.prisma,
  ): Promise<Node> {
    let currentNode = root;

    for (let i = 0; i < binaryKey.length; i++) {
      if (currentNode.key) {
        // collision - we need to split the node
        const collisionKey = splitKey(currentNode.key);
        const newParent = await tx[this.nodeRepositoryName].update({
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
      const child = await this.getChild(currentNode.id, side, tx);

      if (!child) {
        currentNode = await tx[this.nodeRepositoryName].create({
          data: {
            hash: hash.toString(),
            [this.entityName]: {
              connect: {
                id: dataId,
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

  protected getNode(
    id: number,
    tx: PrismaTransactionalClient = this.prisma,
    includeData: boolean = false,
  ): Promise<Node> {
    return tx[this.nodeRepositoryName].findUnique({
      where: { id },
      include: { [this.entityName]: includeData },
    });
  }

  protected getChildren(
    parentId: number,
    tx: PrismaTransactionalClient = this.prisma,
  ): Promise<Node[]> {
    return tx[this.nodeRepositoryName].findMany({
      where: { parent_id: parentId },
    });
  }

  private getChild(
    parentId: number,
    side: ChildSide,
    tx: PrismaTransactionalClient = this.prisma,
    includeData: boolean = false,
  ): Promise<Node | null> {
    return tx[this.nodeRepositoryName].findUnique({
      where: {
        unique_parent_side: {
          parent_id: parentId,
          side,
        },
      },
      include: {
        [this.entityName]: includeData,
      },
    });
  }

  async deleteNode(
    prescriptionId: number,
    tx: PrismaTransactionalClient = this.prisma,
  ) {
    let currentNode = await tx[this.nodeRepositoryName].findFirst({
      where: { key: prescriptionId },
    });

    if (!currentNode) {
      throw new NotFoundException(
        `Prescription node for ${prescriptionId} not found`,
      );
    }

    let sibling = await tx[this.nodeRepositoryName].findFirst({
      where: {
        parent_id: currentNode.parent_id,
        id: { not: currentNode.id },
      },
    });

    if (!sibling) {
      // Find closest sibling
      while (!sibling) {
        await tx[this.nodeRepositoryName].delete({
          where: { id: currentNode.id },
        });

        sibling = await tx[this.nodeRepositoryName].findFirst({
          where: {
            parent_id: currentNode.parent_id,
            id: { not: currentNode.id },
          },
        });

        currentNode = await tx[this.nodeRepositoryName].findFirst({
          where: { id: currentNode.parent_id },
        });

        if (!currentNode) {
          return;
        }
      }
    }
    // Delete node and sibling
    await tx[this.nodeRepositoryName].delete({
      where: { id: sibling.id },
    });
    await tx[this.nodeRepositoryName].delete({
      where: { id: currentNode.id },
    });

    if (currentNode.parent_id) {
      currentNode = await tx[this.nodeRepositoryName].update({
        where: { id: currentNode.parent_id },
        data: {
          hash: sibling.hash,
          key: sibling.key,
        },
      });
    }

    // Simplify tree
    while (currentNode.parent_id) {
      const parent = await tx[this.nodeRepositoryName].findFirst({
        where: { id: currentNode.parent_id },
        include: {
          children: true,
        },
      });

      if (parent.children.length == 2) {
        await tx[this.nodeRepositoryName].update({
          where: { id: currentNode.id },
          data: {
            hash: sibling.hash,
            key: sibling.key,
          },
        });
        break;
      }

      await tx[this.nodeRepositoryName].delete({
        where: { id: currentNode.id },
      });

      currentNode = parent;
    }

    if (currentNode.parent_id) {
      const parent = await tx[this.nodeRepositoryName].findFirst({
        where: { id: currentNode.parent_id },
      });
      await this.updateHashes(parent, tx);
    }
  }

  protected async getNodeFromKey(
    key: number,
    includeData: boolean = false,
    tx: PrismaTransactionalClient = this.prisma,
  ): Promise<Node | null> {
    return tx[this.nodeRepositoryName].findFirst({
      where: { key },
      include: { [this.entityName]: includeData },
    });
  }

  async verifyNode(key: number): Promise<InclusionProofGenerationData> {
    const root = await this.getRoot();
    if (!root) throw new Error('Root node not found');
    const siblings = await this.getSiblings(key);
    const node = await this.getNodeFromKey(key, true);
    return {
      root: BigInt(root.hash),
      siblings,
      key: node.key,
      value: this.hashData(node[this.entityName]),
    };
  }
}
