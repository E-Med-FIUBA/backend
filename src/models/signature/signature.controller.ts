import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SignatureService } from './signature.service';
import { Prescription } from '@prisma/client';

@Controller('signature')
export class SignatureController {
  constructor(private readonly signatureService: SignatureService) { }

  @Get('/verify/:id')
  findAll(@Param('id', ParseIntPipe) prescriptionId: number): Promise<Prescription> {
    return this.signatureService.verify(prescriptionId);
  }
}
