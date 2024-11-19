import { Transform } from 'class-transformer';
import { isISO8601, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PrescriptionDTO {
  @IsNumber()
  @IsNotEmpty()
  patientId: number;

  @IsNumber()
  @IsNotEmpty()
  presentationId: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  indication: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @Transform(({ value }) => {
    const isValidDate = isISO8601(value, {
      strict: true,
      strictSeparator: true,
    });
    if (!isValidDate) {
      throw new Error(
        `Property "emitedAt" should be a valid ISO8601 date string`,
      );
    }
    return new Date(value);
  })
  @IsNotEmpty()
  emitedAt: Date;
}
