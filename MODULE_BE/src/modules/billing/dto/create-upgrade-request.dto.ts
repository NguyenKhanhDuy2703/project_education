import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUpgradeRequestDto {
  @ApiProperty({ description: 'ID of subscription plan to purchase' })
  @IsString()
  @IsNotEmpty()
  planId: string;
}
