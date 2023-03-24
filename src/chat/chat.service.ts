import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationNotFoundError } from '../lib/errors/chat';
import { FriendshipNotExists } from '../lib/errors/friend';
import { UserFriendshipRequest } from '../user/entities/user-friendship-request.entity';
import { FriendService } from '../user/friend.service';
import { ConversationParticipants } from './entities/conversation-participants.entity';
import { Conversation } from './entities/conversation.entity';
import * as crypto from 'crypto';
import { Message } from './entities/message.entity';
import { SocketGateway } from '../socket.gateway';

@Injectable()
export class ChatService {

    constructor(
        private readonly friendSrv: FriendService,
        @InjectRepository(Conversation)
        private readonly conversationRepo: Repository<Conversation>,
        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,
        private readonly socketGateway: SocketGateway,
    ) { }

    async getDirectConversation(requesterUid: string, uid: string, offset?: number) {
        const conversation = await this.conversationRepo.findOne({
            where: {
                participants: [
                    {
                        participantId: requesterUid,
                    },
                    {
                        participantId: uid,
                    }
                ],
            },
            relations: ['participants']
        })
        if (!conversation) {
            throw new ConversationNotFoundError('Conversation not found!');
        }
        const messages = await this.messageRepo.find({
            where: {
                conversation: {
                    id: conversation.id,
                }
            },
            take: 100,
            skip: offset || 0,
            order: {
                sendAt: 'ASC',
            }
        })
        return {
            ...conversation,
            messages,
        };
    }

    async createDirectConversation(requesterUid: string, uid: string) {
        const friendRequest = await this.friendSrv.getFriend(requesterUid, uid);
        if (!friendRequest) {
            throw new FriendshipNotExists('Friendship not exists!');
        }
        const conversationId = crypto.randomUUID();
        const conversation = await this.conversationRepo.save({
            id: conversationId,
            participants: [
                {
                    conversationId,
                    participantId: requesterUid,
                },
                {
                    conversationId,
                    participantId: uid,
                }
            ]
        });
        return {
            ...conversation,
            messages: [],
        };
    }

    async sendMessage(requesterUid: string, conversationId: string, message: string) {
        const conversation = await this.conversationRepo.findOne({
            where: {
                id: conversationId,
                participants: [
                    {
                        participantId: requesterUid,
                    }
                ],
            },
            relations: ['participants']
        })
        if (!conversation) {
            throw new ConversationNotFoundError('Conversation not found!');
        }
        const messageEntity = await this.messageRepo.save({
            conversation: {
                id: conversationId,
            },
            content: message,
            sender: requesterUid
        });
        const socket = this.socketGateway.server;
        const fullConversation = await this.conversationRepo.findOne({
            where: {
                id: conversationId,
            },
            relations: ['participants']
        })
        fullConversation.participants.forEach(participant => {
            if (participant.participantId !== requesterUid) {
                console.log(participant.participantId)
                socket.to(participant.participantId).emit('message', messageEntity);
            }
        })
        return messageEntity;
    }

}
