import { registerAs } from "@nestjs/config";

export default registerAs('swagger', () => ({
    enabled: process.env.SWAGGER_ENABLED === 'true',
    title: process.env.SWAGGER_TITLE,
    description: process.env.SWAGGER_DESCRIPTION,
    version: process.env.SWAGGER_VERSION,
    prefix: process.env.SWAGGER_PREFIX,
}))