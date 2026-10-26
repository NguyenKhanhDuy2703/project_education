import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { BillingCycle } from '@prisma/client';

export class CreatePlanDto {
  @ApiProperty({ example: 'PRO_MONTHLY', description: 'Unique plan identifier' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Pro Student (Monthly)', description: 'Display name of the plan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Full access to solutions and AI tools', description: 'Plan description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 199000, description: 'Price in local currency' })
  @IsNumber()
  price: number;

  @ApiProperty({ enum: BillingCycle, default: BillingCycle.MONTHLY, description: 'Billing frequency' })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiPropertyOptional({ default: false, description: 'Whether this plan is the default fallback free tier' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Whether this plan is visible publicly' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Whether this plan is ready for sale' })
  @IsBoolean()
  @IsOptional()
  isSaleReady?: boolean;
}
