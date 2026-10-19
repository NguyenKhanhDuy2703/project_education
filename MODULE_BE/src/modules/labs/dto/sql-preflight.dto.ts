import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SqlPreflightDto {
  @ApiProperty({ description: 'DDL and optional seed DML executed in a fresh PGlite database.' })
  @IsString()
  @MaxLength(1_250_000)
  schemaSql: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(1_000_000)
  @IsOptional()
  seedSql?: string;

  @ApiProperty({ description: 'Reference solution to execute.' })
  @IsString()
  @MaxLength(50_000)
  solution: string;

  @ApiPropertyOptional({ enum: ['read_only', 'mutable'], default: 'read_only' })
  @IsIn(['read_only', 'mutable'])
  @IsOptional()
  statementPolicy?: 'read_only' | 'mutable';

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(50_000)
  @IsOptional()
  verificationSql?: string;

  @ApiPropertyOptional({ minimum: 500, maximum: 10000, default: 3000 })
  @IsInt()
  @Min(500)
  @Max(10000)
  @IsOptional()
  timeoutMs?: number;
}
