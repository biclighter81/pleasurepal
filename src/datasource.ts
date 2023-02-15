import { DataSource } from 'typeorm';
import { LovenseCredentials_DiscordSession } from './lovense/entities/credentials_discord_session.join-entity';
import { LovenseCredentials } from './lovense/entities/lovense-credentials.entity';
import { LovenseDiscordSession } from './lovense/entities/lovense-discord-session.entity';
import { LovenseToy } from './lovense/entities/lovense-toy.entity';

// eslint-disable-next-line
const dotenv = require('dotenv');
dotenv.config();
export const AppDataSource = new DataSource({
  type: process.env.DB_TYPE as any,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [
    LovenseCredentials,
    LovenseToy,
    LovenseDiscordSession,
    LovenseCredentials_DiscordSession,
  ],
  schema: process.env.DB_SCHEMA,
  synchronize: true,
  logging: process.env.LOG_LEVELS
    ? (process.env.LOG_LEVELS.split(',') as any)
    : ['warn', 'error'],
});
