import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OverrideEffect } from '@prisma/client';

export class SetFeatureOverrideDto {
  @ApiProperty({ example: 'VIEW_SOLUTION', description: 'Feature code to override' })
  @IsString()
  @IsNotEmpty()
  featureCode: string;

  @ApiProperty({ enum: OverrideEffect, example: OverrideEffect.DENY, description: 'Override effect: ALLOW (grant) or DENY (ban)' })
  @IsEnum(OverrideEffect)
  @IsNotEmpty()
  effect: OverrideEffect;

  @ApiProperty({ example: 'Account flagged for solution sharing; suspended for 7 days', description: 'Mandatory reason for audit log' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ example: '2026-10-16T00:00:00.000Z', description: 'Optional expiration timestamp' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
