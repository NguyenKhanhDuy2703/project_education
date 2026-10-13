import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddGroupMemberDto {
  @ApiProperty({ example: 'user-uuid-1', description: 'ID of user to add to this group' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
