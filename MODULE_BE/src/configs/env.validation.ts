import { plainToInstance } from 'class-transformer';

import { IsEnum, IsNumber, IsString, IsNotEmpty, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
} 
class EnvironmentVariables  {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNotEmpty()
  @IsString()
  PORT: string;

  @IsNotEmpty()
  @IsString()
  JWT_SECRET: string;

  @IsNotEmpty()
  @IsString()
  JWT_EXPIRES_IN: string;

  @IsNotEmpty()
  @IsString()
  DATABASE_URL: string;
  
}

export default function validateEnvironmentVariables(config: Record<string, unknown>) {
  const validatedEnv = plainToInstance(EnvironmentVariables, config);
  const errors = validateSync(validatedEnv, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedEnv;
}