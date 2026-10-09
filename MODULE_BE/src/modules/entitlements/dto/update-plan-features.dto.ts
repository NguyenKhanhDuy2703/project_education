import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdatePlanFeaturesDto {
  @ApiProperty({
    example: ['f1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000002'],
    description: 'Array of Feature UUIDs mapped to this plan',
  })
  @IsArray()
  @IsString({ each: true })
  featureIds: string[];
}
