import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class ApproveUpgradeRequestDto {
  @ApiProperty({ example: 199000, description: 'Verified amount transferred in VND' })
  @IsNumber()
  @IsPositive()
  verifiedAmount: number;

  @ApiPropertyOptional({ example: 'VCB-TX-987654321', description: 'Bank transaction reference verified by admin' })
  @IsString()
  @IsOptional()
  verifiedBankReference?: string;

  @ApiPropertyOptional({ example: 'VCB-TX-987654321', description: 'Alias for verifiedBankReference' })
  @IsString()
  @IsOptional()
  verifiedBankRef?: string;
}

