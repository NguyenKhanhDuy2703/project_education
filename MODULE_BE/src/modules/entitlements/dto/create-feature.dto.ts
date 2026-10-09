import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FeatureCategory } from '@prisma/client';

export class CreateFeatureDto {
  @ApiProperty({ example: 'AI_CODE_REVIEW', description: 'Unique uppercase feature identifier code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'AI Code Mentor', description: 'Display name of the feature' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Real-time AI assistance when lab tests fail', description: 'Feature description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    enum: FeatureCategory,
    default: FeatureCategory.content_access,
    description: 'Category group for the feature',
  })
  @IsEnum(FeatureCategory)
  @IsOptional()
  category?: FeatureCategory;
}
