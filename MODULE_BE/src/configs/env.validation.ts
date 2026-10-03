import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsUrl,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNotEmpty()
  @IsNumberString()
  PORT: string;

  @IsNotEmpty()
  @IsString()
  JWT_SECRET: string;

  @IsNotEmpty()
  @IsString()
  JWT_EXPIRES_IN: string;

  @IsOptional()
  @IsString()
  ACCESS_TOKEN_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  REFRESH_TOKEN_EXPIRES_IN?: string;

  @IsNotEmpty()
  @IsString()
  DATABASE_URL: string;

  @IsOptional()
  @IsString()
  FRONTEND_URL?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;
}

export default function validateEnvironmentVariables(config: Record<string, unknown>) {
  const validatedEnv = plainToInstance(EnvironmentVariables, config);
  const errors = validateSync(validatedEnv, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedEnv;
}