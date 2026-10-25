import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdatePositionDto {
  @ApiPropertyOptional()
  @IsOptional()
  position?: Record<string, any>;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  scrollPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  formativeAnswers?: Record<string, any>;
}

export class CompleteTheoryDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  score?: number;
}
