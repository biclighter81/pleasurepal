import { DataSource } from "typeorm"
import { env } from "./env"
import debug from "debug"
import { ActionQueue } from "./lib/entities/action-queue.entity"
import { ConversationParticipants } from "./lib/entities/conversation-participants.entity"
import { Conversation } from "./lib/entities/conversation.entity"
import { DeferredDiscordInvite } from "./lib/entities/deferred-discord-invite.entity"
import { Device } from "./lib/entities/device.entity"
import { LovenseHeartbeat } from "./lib/entities/lovense-heartbeat.entity"
import { LovenseToy } from "./lib/entities/lovense-toy.entity"
import { Message } from "./lib/entities/message.entity"
import { PleasureSession } from "./lib/entities/pleasure-session.entity"
import { User_PleasureSession } from "./lib/entities/user_plesure_session.entity"
import { UserFriendshipRequest } from "./lib/entities/user-friendship-request.entity"
import { UserPreferences } from "./lib/entities/preferences.entity"

const log = debug('datasource')
const AppDataSource = new DataSource({
    type: process.env.DB_TYPE as any,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [ActionQueue, ConversationParticipants, Conversation, DeferredDiscordInvite, Device, LovenseHeartbeat, LovenseToy, Message, PleasureSession, User_PleasureSession, UserFriendshipRequest, UserPreferences],
    synchronize: env.isDevelopment
})
AppDataSource.initialize()
    .then(() => {
        log("Data Source has been initialized!")
    })
    .catch((err) => {
        log("Error during Data Source initialization", err)
    })
export { AppDataSource };