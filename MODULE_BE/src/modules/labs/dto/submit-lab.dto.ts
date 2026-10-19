import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SubmitLabDto {
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
