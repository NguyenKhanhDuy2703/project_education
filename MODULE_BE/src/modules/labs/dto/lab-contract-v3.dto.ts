import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class AutomationBlockParameterDto {
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
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({ enum: ['string', 'number', 'boolean', 'enum', 'role'] })
  @IsString()
  @IsIn(['string', 'number', 'boolean', 'enum', 'role'])
  type: 'string' | 'number' | 'boolean' | 'enum' | 'role';

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  defaultValue?: any;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  options?: Array<{ value: string; label: string }>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  placeholder?: string;
}

export class AutomationBlockDefinitionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  blockType: string;

  @ApiPropertyOptional({ enum: ['navigation', 'locator', 'action', 'assertion', 'data'] })
  @IsString()
  @IsIn(['navigation', 'locator', 'action', 'assertion', 'data'])
  category: 'navigation' | 'locator' | 'action' | 'assertion' | 'data';

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  codePattern: string;

  @ApiPropertyOptional({ type: [AutomationBlockParameterDto] })
  @IsArray()
  parameters: AutomationBlockParameterDto[];

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxCountPerTest?: number;
}

export class AutomationStepDto {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  blockType: string;

  @ApiPropertyOptional({ enum: ['navigation', 'locator', 'action', 'assertion', 'data'] })
  @IsString()
  @IsIn(['navigation', 'locator', 'action', 'assertion', 'data'])
  category: 'navigation' | 'locator' | 'action' | 'assertion' | 'data';

  @ApiPropertyOptional()
  @IsObject()
  params: Record<string, any>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;
}

export class AutomationPublicCheckDto {
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

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  conceptTag?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ruleType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  targetBlockType?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  expectedParamValue?: Record<string, any>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  hint?: string;
}

export class AutomationFixtureConfigDto {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  fixtureId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  fixtureVersion: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  initialRoute: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  initialState?: Record<string, unknown>;
}

export class AutomationExerciseV3Dto {
  @ApiPropertyOptional({ default: '3.0' })
  @IsString()
  @IsIn(['3.0'])
  version: '3.0';

  @ApiPropertyOptional({ default: 'playwright' })
  @IsString()
  @IsIn(['playwright'])
  framework: 'playwright';

  @ApiPropertyOptional({
    enum: ['block_builder', 'smart_cloze', 'guided_code', 'full_code'],
    default: 'block_builder',
  })
  @IsString()
  @IsIn(['block_builder', 'smart_cloze', 'guided_code', 'full_code'])
  interactionMode: 'block_builder' | 'smart_cloze' | 'guided_code' | 'full_code';

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  contentRevision: string;

  @ApiPropertyOptional({ type: AutomationFixtureConfigDto })
  @IsObject()
  fixture: AutomationFixtureConfigDto;

  @ApiPropertyOptional({ type: [AutomationBlockDefinitionDto] })
  @IsArray()
  allowedBlocks: AutomationBlockDefinitionDto[];

  @ApiPropertyOptional({ type: [AutomationStepDto] })
  @IsArray()
  starterPlan: AutomationStepDto[];

  @ApiPropertyOptional({ type: [AutomationPublicCheckDto] })
  @IsArray()
  publicChecks: AutomationPublicCheckDto[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  gradingRules?: any[];

  @ApiPropertyOptional({ enum: ['typescript', 'javascript'], default: 'typescript' })
  @IsString()
  @IsIn(['typescript', 'javascript'])
  exportTemplate: 'typescript' | 'javascript';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  targetFunction?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  scenarioDescription?: string;
}

export class AutomationV3SubmissionPayloadDto {
  @ApiPropertyOptional({ default: '3.0' })
  @IsString()
  version: '3.0';

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  exerciseRevision: string;

  @ApiPropertyOptional({ type: [AutomationStepDto] })
  @IsArray()
  stepPlan: AutomationStepDto[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  answers?: Record<string, any>;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  generatedCode: string;

  @ApiPropertyOptional({ enum: ['passed', 'failed'] })
  @IsString()
  @IsIn(['passed', 'failed'])
  status: 'passed' | 'failed';

  @ApiPropertyOptional()
  @IsNumber()
  timeMs: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  logs?: string[];
}
