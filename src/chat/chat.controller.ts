import { Controller, Get, Param, UseGuards, Post, HttpException, Body } from '@nestjs/common';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
import { ConversationNotFoundError } from '../lib/errors/chat';
import { FriendshipNotExists } from '../lib/errors/friend';
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
        try {
            return await this.chatService.getDirectConversation(user.sub, uid);
        } catch (e) {
            if (e instanceof ConversationNotFoundError) {
                throw new HttpException({
                    message: e.message,
                    name: e.name,
                }, 404);
            }
            console.log(e)
            throw new HttpException({
                message: e.message,
                name: e.name,
            }, 500);
        }
    }

    @UseGuards(AuthGuard)
    @Get('conversation/direct/:uid/:offset')
    async getDirectConversationWithOffset(
        @AuthenticatedUser() user: JWTKeycloakUser,
        @Param('uid') uid: string,
        @Param('offset') offset: number,
    ) {
        return this.chatService.getDirectConversation(user.sub, uid, offset);
    }

    @UseGuards(AuthGuard)
    @Post('conversation/direct/:uid')
    async createDirectConversation(
        @AuthenticatedUser() user: JWTKeycloakUser,
        @Param('uid') uid: string,
    ) {
        try {
            return await this.chatService.createDirectConversation(user.sub, uid);
        } catch (e) {
            if (e instanceof FriendshipNotExists) {
                throw new HttpException({
                    message: e.message,
                    name: e.name,
                }, 400);
            }
            console.log(e)
            throw new HttpException({
                message: e.message,
                name: e.name,
            }, 500);
        }
    }

    @UseGuards(AuthGuard)
    @Post('message/:conversationId')
    async sendMessage(
        @AuthenticatedUser() user: JWTKeycloakUser,
        @Param('conversationId') conversationId: string,
        @Body() body: {
            content: string,
        }
    ) {
        try {
            return await this.chatService.sendMessage(user.sub, conversationId, body.content);
        } catch (e) {
            if (e instanceof ConversationNotFoundError) {
                throw new HttpException({
                    message: e.message,
                    name: e.name,
                }, 404);
            }
            console.log(e)
            throw new HttpException({
                message: e.message,
                name: e.name,
            }, 500);
        }
    }

}
