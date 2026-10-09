import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole, description: 'Target user role to assign (admin, user, userPro)' })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
