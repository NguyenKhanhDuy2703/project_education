import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateBillingSettingsDto {
  @ApiPropertyOptional({ example: 'Vietcombank', description: 'Name of receiving bank' })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({ example: 'VCB', description: 'Bank code or BIN' })
  @IsString()
  @IsOptional()
  bankCode?: string;

  @ApiPropertyOptional({ example: '1012345678', description: 'Bank account number' })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'CONG TY STUDYIT', description: 'Account holder name' })
  @IsString()
  @IsOptional()
  accountHolder?: string;

  @ApiPropertyOptional({ example: 'Transfer with transfer reference as description', description: 'Transfer instructions' })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiProperty({ example: false, description: 'Whether intake of new upgrade requests is enabled' })
  @IsBoolean()
  isIntakeEnabled: boolean;
}

