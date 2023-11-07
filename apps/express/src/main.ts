import dotenv from 'dotenv';
dotenv.config()
import 'reflect-metadata';
import 'express-async-errors';
import './api/controllers/ctx';
import './datasource';
import './env';
import { Container } from 'inversify';
import TYPES from './lib/symbols';
import { InversifyExpressServer } from 'inversify-express-utils';
import { Repository } from 'typeorm';
import { TestEntity } from './lib/entities/test.entity';
import { getRepository } from './lib/repo-helper';
import { RequestHandler } from 'express';
import { env } from './env';
import cors from 'cors';
import { Conversation } from './lib/entities/conversation.entity';
import { Message } from './lib/entities/message.entity';
import { UserFriendshipRequest } from './lib/entities/user-friendship-request.entity';
import { PleasureSession } from './lib/entities/pleasure-session.entity';
import { User_PleasureSession } from './lib/entities/user_plesure_session.entity';
import { DeferredDiscordInvite } from './lib/entities/deferred-discord-invite.entity';
import { LovenseHeartbeat } from './lib/entities/lovense-heartbeat.entity';
import { LovenseToy } from './lib/entities/lovense-toy.entity';
import { ChatService } from './api/services/ChatService';
import { DeviceService } from './api/services/DeviceService';
import { DiscordService } from './api/services/DiscordService';
import { DiscordSessionService } from './api/services/DiscordSessionService';
import { FriendService } from './api/services/FriendService';
import { LovenseService } from './api/services/LovenseService';
import { SessionService } from './api/services/SessionService';
import AuthErrorHandler from './api/middlewares/AuthErrorHandler';
import { auth } from 'express-oauth2-jwt-bearer'
import DefaultErrorHandler from './api/middlewares/DefaultErrorHandler';
import bodyParser from 'body-parser';
import Debug from 'debug';
import { Socket } from './api/services/Socket';
import { Discord } from './api/services/Discord';
const container = new Container()
//bind middlewares
container.bind<RequestHandler>(TYPES.AuthMiddleware).toDynamicValue(() => auth({
    issuerBaseURL: env.oidc.issuerBaseURL,
    audience: 'account',
})).inRequestScope()
//bind singletons
container.bind<Socket>(TYPES.Socket).toDynamicValue(() => {
    return new Socket(container)
}).inSingletonScope()
container.bind<Discord>(TYPES.Discord).to(Discord).inSingletonScope();
//bind services
container.bind<ChatService>(TYPES.ChatService).to(ChatService);
container.bind<DeviceService>(TYPES.DeviceService).to(DeviceService);
container.bind<DiscordService>(TYPES.DiscordService).to(DiscordService);
container.bind<DiscordSessionService>(TYPES.DiscordSessionService).to(DiscordSessionService);
container.bind<FriendService>(TYPES.FriendService).to(FriendService);
container.bind<LovenseService>(TYPES.LovenseService).to(LovenseService);
container.bind<SessionService>(TYPES.SessionService).to(SessionService);
//bind orm repositories
container.bind<Repository<TestEntity>>(TYPES.TestRepository).toDynamicValue(() => {
    return getRepository(TestEntity)
}).inRequestScope()
container.bind<Repository<Conversation>>(TYPES.ConversationRepository).toDynamicValue(() => {
    return getRepository(Conversation)
}).inRequestScope()
container.bind<Repository<Message>>(TYPES.MessageRepository).toDynamicValue(() => {
    return getRepository(Message)
}).inRequestScope()
container.bind<Repository<UserFriendshipRequest>>(TYPES.UserFriendShipRequestRepository).toDynamicValue(() => {
    return getRepository(UserFriendshipRequest)
}).inRequestScope()
container.bind<Repository<PleasureSession>>(TYPES.PleasureSessionRepository).toDynamicValue(() => {
    return getRepository(PleasureSession)
}).inRequestScope()
container.bind<Repository<User_PleasureSession>>(TYPES.UserSessionRepository).toDynamicValue(() => {
    return getRepository(User_PleasureSession)
}).inRequestScope()
container.bind<Repository<DeferredDiscordInvite>>(TYPES.DeferredDiscordInviteRepository).toDynamicValue(() => {
    return getRepository(DeferredDiscordInvite)
}).inRequestScope()
container.bind<Repository<LovenseHeartbeat>>(TYPES.LovenseHeartbeatRepository).toDynamicValue(() => {
    return getRepository(LovenseHeartbeat)
}).inRequestScope()
container.bind<Repository<LovenseToy>>(TYPES.LovenseToyRepository).toDynamicValue(() => {
    return getRepository(LovenseToy)
}).inRequestScope()

const server = new InversifyExpressServer(container, null, { rootPath: '/api' })
server.setConfig((app) => {
    app.use(cors({
        origin: '*'
    }))
    app.use(bodyParser.json({ limit: '10mb' }))
})
server.setErrorConfig((app) => {
    app.use(AuthErrorHandler)
    app.use(DefaultErrorHandler)
})
let app = server.build();
app.listen(3001, () => {
    const log = Debug('express:server')
    log('Server is listening on :3001')
})