import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export type LabSubmissionType = 'code' | 'pull_request' | 'test_file';

export class SubmitLabDto {
  @ApiPropertyOptional({ enum: ['code', 'pull_request', 'test_file'], default: 'code' })
  @IsEnum(['code', 'pull_request', 'test_file'], {
    message: 'submissionType must be one of: code, pull_request, test_file',
  })
  @IsOptional()
  submissionType?: LabSubmissionType;

  @ApiProperty()
  @IsString()
  @MaxLength(50_000)
  submittedCode: string;

  @ApiPropertyOptional({ description: 'Client hint only; ignored for SQL grading.' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Client timing hint only; ignored for SQL grading.' })
  @IsInt()
  @Min(0)
  @Max(600_000)
  @IsOptional()
  timeMs?: number;

  @ApiPropertyOptional({ description: 'Client log hint only; ignored for SQL grading.' })
  @IsString()
  @MaxLength(10_000)
  @IsOptional()
  testLogs?: string;
}
