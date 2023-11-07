const TYPES = {
    Socket: Symbol.for('Socket'),
    Discord: Symbol.for('Discord'),

    ChatService: Symbol.for('ChatService'),
    DeviceService: Symbol.for('DeviceService'),
    DiscordSessionService: Symbol.for('DiscordSessionService'),
    DiscordService: Symbol.for('DiscordService'),
    FriendService: Symbol.for('FriendService'),
    LovenseService: Symbol.for('LovenseService'),
    MembershipService: Symbol.for('MembershipService'),
    SchedulerService: Symbol.for('SchedulerService'),
    SessionService: Symbol.for('SessionService'),

    TestRepository: Symbol.for('TestRepository'),
    ConversationRepository: Symbol.for('ConversationRepository'),
    MessageRepository: Symbol.for('MessageRepository'),
    UserFriendShipRequestRepository: Symbol.for('UserFriendShipRequestRepository'),
    PleasureSessionRepository: Symbol.for('PleasureSessionRepository'),
    UserSessionRepository: Symbol.for('UserSessionRepository'),
    DeferredDiscordInviteRepository: Symbol.for('DeferredDiscordInviteRepository'),
    LovenseHeartbeatRepository: Symbol.for('LovenseHeartbeatRepository'),
    LovenseToyRepository: Symbol.for('LovenseToyRepository'),

    AuthMiddleware: Symbol.for('AuthMiddleware'),

};

export default TYPES;