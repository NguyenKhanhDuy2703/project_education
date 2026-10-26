import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitPaymentDto {
  @ApiProperty({ example: 'FT241026001234', description: 'Bank transaction reference from learner transfer' })
  @IsString()
  @IsNotEmpty()
  paymentReference: string;
}
