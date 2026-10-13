import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AssignPlansToGroupDto {
  @ApiProperty({ example: ['plan-uuid-1', 'plan-uuid-2'], description: 'List of Subscription Plan IDs to assign to group' })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  planIds: string[];
}
