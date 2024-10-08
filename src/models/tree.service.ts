import { ChildSide } from '@prisma/client';
import { poseidon2, poseidon3 } from 'poseidon-lite';
import { PrismaService } from '../prisma.service';
import { PrismaTransactionalClient } from 'utils/types';

const keyLength = 4; // key length in bits - TODO: change this to a higher value. The number of available keys is 2^keyLength

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

interface ProofGenerationData {
  fnc: [number, number];
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

interface NodeData {
  id: number;
}

interface Node {
  id: number;
  hash: bigint;
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

  private hash0 = (left: bigint, right: bigint): bigint =>
    poseidon2([left, right]);

  private hash1 = (key: bigint | number, value: bigint): bigint =>
    poseidon3([key, value, 1n]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected hashData = (data: NodeData): bigint => {
    throw new Error('Not implemented');
  };

  async createNode(
    nodeData: NodeData,
    tx: PrismaTransactionalClient = this.prisma,
  ): Promise<ProofGenerationData> {
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
      fnc: [1, 0],
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

  private async getSiblingsAndOldNode(
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
  ): Promise<ProofGenerationData> {
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
      fnc: [1, 0],
      oldRoot: 0n,
      newRoot: rootHash,
      siblings: [0n, 0n, 0n, 0n],
      oldKey: 0,
      oldValue: 0n,
      isOld0: 1,
      newKey: nodeData.id,
      newValue: hashedValue,
    };
  }

  private async updateHashes(
    currentNode: Node,
    tx: PrismaTransactionalClient = this.prisma,
  ): Promise<bigint> {
    let currentHash = currentNode.hash;
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
}
