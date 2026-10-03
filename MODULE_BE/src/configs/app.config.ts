import { registerAs } from "@nestjs/config";

export default registerAs('app', () => ({
    port: process.env.PORT || 3000,
    prefix: process.env.API_PREFIX || process.env.PREFIX || 'api/v1',
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '',
}))