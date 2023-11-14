import * as dotenv from 'dotenv';
import * as path from 'path';
import { getOsPaths } from './lib/env/utils';
/**
 * Load .env file or for tests the .env.test file.
 */
dotenv.config({ path: path.join(process.cwd(), `.env${((process.env.NODE_ENV === 'test') ? '.test' : '')}`) });

/**
 * Environment variables
 */
export const env = {
    node: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    isDevelopment: process.env.NODE_ENV === 'development',
    app: {
        dirs: {
            entities: ['src/lib/entities/**/*.{ts,js}', 'lib/entities/**/*.{ts,js}'],
            discordCommands: getOsPaths('DISCORD_COMMANDS'),
        },
        allowedOrigin: process.env['ALLOWED_ORIGIN'],
    },
    oidc: {
        issuerBaseURL: process.env['OIDC_ISSUER'],
        baseURL: process.env['OIDC_BASE_URL'],
        clientID: process.env['OIDC_CLIENT_ID'],
        clientSecret: process.env['OIDC_CLIENT_SECRET'],
        secret: process.env['SESSION_SECRET'],
    },
    redis: {
        url: process.env['REDIS_URL'],
    },
    discord: {
        token: process.env['DISCORD_TOKEN'],
        appId: process.env['DISCORD_APP_ID'],
    }
}