import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'CONTRIBUTOR_TEAM', description: 'Unique group code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Content Contributor Team', description: 'Group display name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Educators and authors creating labs', description: 'Group purpose description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: true, description: 'Active status of the group' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: ['plan-uuid-1'], description: 'Initial plan IDs assigned to this group' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  planIds?: string[];
}
