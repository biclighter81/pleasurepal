import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
import { JWTKeycloakUser } from '../lib/interfaces/keycloak';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {

    constructor(
        private readonly chatService: ChatService,
    ) { }

    @UseGuards(AuthGuard)
    @Get('conversation/direct/:uid')
    async getDirectConversation(
        @AuthenticatedUser() user: JWTKeycloakUser,
        @Param('uid') uid: string,
    ) {
        return this.chatService.getDirectConversation(user.sub, uid);
    }

}
