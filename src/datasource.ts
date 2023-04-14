import { DataSource } from 'typeorm';
import { LovenseToy } from './lovense/entities/lovense-toy.entity';
import { UserFriendshipRequest } from './user/entities/user-friendship-request.entity';
import { Conversation } from './chat/entities/conversation.entity';
import { ConversationParticipants } from './chat/entities/conversation-participants.entity';
import { Message } from './chat/entities/message.entity';
import { LovenseHeartbeat } from './lovense/entities/lovense-heartbeat.entity';
import { PleasureSession } from './session/entities/pleasure-session.entity';
import { User_PleasureSession } from './session/entities/user_plesure_session.join-entity';
import { ActionQueue } from './session/entities/action-queue.entity';
import { DeferredDiscordInvite } from './session/entities/deferred-discord-invite.entity';

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
    LovenseHeartbeat,
    LovenseToy,
    PleasureSession,
    User_PleasureSession,
    ActionQueue,
    UserFriendshipRequest,
    Conversation,
    ConversationParticipants,
    Message,
    DeferredDiscordInvite,
  ],
  schema: process.env.DB_SCHEMA,
  synchronize: true,
  useUTC: true,
  logging: process.env.LOG_LEVELS
    ? (process.env.LOG_LEVELS.split(',') as any)
    : ['warn', 'error'],
});
