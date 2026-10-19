import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class AutomationTestStepDto {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ['toBe', 'toEqual', 'toBeDefined', 'toContain'] })
  @IsString()
  matcher: 'toBe' | 'toEqual' | 'toBeDefined' | 'toContain';

  @ApiPropertyOptional()
  @IsOptional()
  expected?: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  hint?: string;
}

export class AutomationTestConfigDto {
  @ApiPropertyOptional({ default: '1.0' })
  @IsString()
  @IsOptional()
  version?: '1.0';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  targetFunction?: string;

  @ApiPropertyOptional({ type: [AutomationTestStepDto] })
  @IsArray()
  @IsOptional()
  steps?: AutomationTestStepDto[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  cheatSheetVisible?: boolean;
}

export class SqlLabConfigDto {
  @ApiPropertyOptional({ default: '1.0' })
  @IsString()
  @IsOptional()
  version?: '1.0' | '2.0';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  schemaSql?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  seedSql?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  expectedQueryResult?: Array<Record<string, unknown>>;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  expectedColumns?: string[];

  @ApiPropertyOptional({ description: 'Hidden query used to inspect state after mutable SQL' })
  @IsString()
  @IsOptional()
  verificationSql?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  orderSensitive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  sampleRowsVisible?: boolean;

  @ApiPropertyOptional({ enum: ['read_only', 'mutable'], default: 'read_only' })
  @IsIn(['read_only', 'mutable'])
  @IsOptional()
  statementPolicy?: 'read_only' | 'mutable';

  @ApiPropertyOptional({ minimum: 500, maximum: 10000, default: 3000 })
  @IsInt()
  @Min(500)
  @Max(10000)
  @IsOptional()
  timeoutMs?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 2000, default: 500 })
  @IsInt()
  @Min(1)
  @Max(2000)
  @IsOptional()
  maxResultRows?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  maxResultColumns?: number;
}

export class QuizQuestionV1Dto {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  options: string[];

  @ApiPropertyOptional()
  @IsNumber()
  correctIndex: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  hint?: string;
}

export class QuizLabConfigDto {
  @ApiPropertyOptional({ default: '1.0' })
  @IsString()
  @IsOptional()
  version?: '1.0';

  @ApiPropertyOptional({ type: [QuizQuestionV1Dto] })
  @IsArray()
  @IsOptional()
  questions?: QuizQuestionV1Dto[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allowReviewBeforeSubmit?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  passPercentage?: number;
}

export class TemplateSegmentDto {
  @ApiPropertyOptional({ enum: ['readonly', 'managed', 'blank'] })
  @IsString()
  kind: 'readonly' | 'managed' | 'blank';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  text?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  blankId?: string;
}

export class BlankDefinitionDto {
  @ApiPropertyOptional()
  @IsString()
  id: string;

  @ApiPropertyOptional({
    enum: [
      'http_status',
      'expected_value',
      'matcher',
      'action',
      'selector',
      'path',
      'method',
      'text',
      'number',
      'boolean',
    ],
  })
  @IsString()
  kind: string;

  @ApiPropertyOptional()
  @IsString()
  label: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({ enum: ['string', 'number', 'boolean', 'json', 'enum'] })
  @IsString()
  valueType: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  placeholder?: string;

  @ApiPropertyOptional()
  @IsOptional()
  defaultValue?: any;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  options?: Array<{ value: any; label: string; description?: string }>;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  validation?: Array<{ type: string; value?: any; message: string }>;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  conceptTags?: string[];
}

export class AutomationExerciseV2Dto {
  @ApiPropertyOptional({ default: '2.0' })
  @IsString()
  version: '2.0';

  @ApiPropertyOptional({ enum: ['smart_cloze', 'guided_code', 'full_code'], default: 'smart_cloze' })
  @IsString()
  interactionMode: 'smart_cloze' | 'guided_code' | 'full_code';

  @ApiPropertyOptional({ enum: ['playwright', 'api', 'generic'] })
  @IsString()
  @IsOptional()
  framework?: 'playwright' | 'api' | 'generic';

  @ApiPropertyOptional({ type: [TemplateSegmentDto] })
  @IsArray()
  publicTemplate: TemplateSegmentDto[];

  @ApiPropertyOptional({ type: [BlankDefinitionDto] })
  @IsArray()
  blanks: BlankDefinitionDto[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  publicChecks?: any[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  gradingRules?: any[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  targetFunction?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  cheatSheetVisible?: boolean;
}

