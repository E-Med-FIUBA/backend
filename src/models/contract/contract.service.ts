import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

import * as ContractArtifact from 'contracts/RootManager.sol/RootManager.json';

const REQUIRED_REPLIES = 2;

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || '';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';

if (!PRIVATE_KEY)
  throw new Error('WALLET_PRIVATE_KEY env variable is required');

if (!CONTRACT_ADDRESS)
  throw new Error('CONTRACT_ADDRESS env variable is required');

const provider = new ethers.JsonRpcProvider('https://sepolia.era.zksync.dev');

const signer = new ethers.Wallet(PRIVATE_KEY, provider);

const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  ContractArtifact.abi,
  signer,
);

export interface Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
}

const toHex = (x: string | bigint) => {
  const hex = BigInt(x).toString(16).padStart(64, '0');

  return '0x' + hex;
};

const parseProof = (proof: Proof): Proof => ({
  pi_a: proof.pi_a.map((x) => toHex(x)).slice(0, -1),
  pi_b: proof.pi_b.map((x) => x.map((y) => toHex(y)).reverse()).slice(0, -1),
  pi_c: proof.pi_c.map((x) => toHex(x)).slice(0, -1),
});

@Injectable()
export class ContractService {
  async updateDoctorsMerkleRoot(newRoot: bigint, proof: Proof) {
    const parsedNewRoot = toHex(newRoot);
    const parsedProof = parseProof(proof);

    const estimatedGasLimit =
      await contract.updateDoctorsMerkleRoot.estimateGas(
        parsedNewRoot,
        parsedProof.pi_a,
        parsedProof.pi_b,
        parsedProof.pi_c,
      );

    console.log('estimatedGasLimit', estimatedGasLimit);

    const txDoctorCreate = await contract.updateDoctorsMerkleRoot(
      parsedNewRoot,
      parsedProof.pi_a,
      parsedProof.pi_b,
      parsedProof.pi_c,
      {
        gasLimit: estimatedGasLimit,
      },
    );
    return txDoctorCreate.wait(REQUIRED_REPLIES);
  }

  async updatePrescriptionsMerkleRoot(newRoot: bigint, proof: Proof) {
    const parsedNewRoot = toHex(newRoot);
    const parsedProof = parseProof(proof);

    const estimatedGasLimit =
      await contract.updatePrescriptionsMerkleRoot.estimateGas(
        parsedNewRoot,
        parsedProof.pi_a,
        parsedProof.pi_b,
        parsedProof.pi_c,
      );

    console.log('estimatedGasLimit', estimatedGasLimit);

    const txPrescriptionCreate = await contract.updatePrescriptionsMerkleRoot(
      parsedNewRoot,
      parsedProof.pi_a,
      parsedProof.pi_b,
      parsedProof.pi_c,
      {
        gasLimit: estimatedGasLimit,
      },
    );

    return txPrescriptionCreate.wait(REQUIRED_REPLIES);
  }

  async updatePrescriptionUsed(newRoot: bigint, proof: Proof) {
    const parsedNewRoot = toHex(newRoot);
    const parsedProof = parseProof(proof);

    const estimatedGasLimit = await contract.verifyMarkAsUsed.estimateGas(
      parsedNewRoot,
      parsedProof.pi_a,
      parsedProof.pi_b,
      parsedProof.pi_c,
    );

    console.log('estimatedGasLimit', estimatedGasLimit);

    const txPrescriptionUsed = await contract.verifyMarkAsUsed(
      parsedNewRoot,
      parsedProof.pi_a,
      parsedProof.pi_b,
      parsedProof.pi_c,
      {
        gasLimit: estimatedGasLimit,
      },
    );

    return txPrescriptionUsed.wait(REQUIRED_REPLIES);
  }
}
