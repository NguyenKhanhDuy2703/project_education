import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AssignSubscriptionDto {
  @ApiProperty({ example: 'p1000000-0000-0000-0000-000000000001', description: 'Target Subscription Plan ID' })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiPropertyOptional({ example: 30, description: 'Duration in days (null for plan default or lifetime)' })
  @IsNumber()
  @IsOptional()
  durationDays?: number;

  @ApiPropertyOptional({ example: 'Student purchased offline package', description: 'Audit rationale' })
  @IsString()
  @IsOptional()
  reason?: string;
}
