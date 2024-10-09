import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';

@Module({
  providers: [ContractService],
})
export class ContractModule {}
