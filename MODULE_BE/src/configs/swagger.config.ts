import { registerAs } from "@nestjs/config";

export default registerAs('swagger', () => ({
  enabled: process.env.SWAGGER_ENABLED === 'true',
  title: process.env.SWAGGER_TITLE || 'StudyIT API',
  description: process.env.SWAGGER_DESCRIPTION || 'StudyIT — API Documentation',
  version: process.env.SWAGGER_VERSION || '1.0',
  prefix: process.env.SWAGGER_PREFIX || 'api/docs',
  user: process.env.SWAGGER_USER,
  password: process.env.SWAGGER_PASSWORD,
}));