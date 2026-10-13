import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { BillingCycle } from '@prisma/client';

export class UpdatePlanDto {
  @ApiPropertyOptional({ example: 'Pro Student (Monthly)', description: 'Display name of the plan' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Full access to solutions and AI tools', description: 'Plan description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 199000, description: 'Price in local currency' })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ enum: BillingCycle, description: 'Billing frequency' })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ description: 'Whether this plan is active for purchase' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Whether this plan is the default fallback free tier' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
