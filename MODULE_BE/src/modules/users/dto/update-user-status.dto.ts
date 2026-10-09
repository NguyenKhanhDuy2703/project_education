import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserStatusDto {
  @ApiProperty({ description: 'Active status of the user account (true: active, false: suspended)' })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
