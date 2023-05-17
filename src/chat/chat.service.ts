import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationNotFoundError } from '../lib/errors/chat';
import { FriendshipNotExists } from '../lib/errors/friend';
import { FriendService } from '../user/friend.service';
import { Conversation } from './entities/conversation.entity';
import * as crypto from 'crypto';
import { Message } from './entities/message.entity';
import { ChatGateway } from './chat.gateways';
import { ConversationParticipants } from './entities/conversation-participants.entity';

@Injectable()
export class ChatService {
  constructor(
    private readonly friendSrv: FriendService,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(ConversationParticipants)
    private readonly participantsRepo: Repository<ConversationParticipants>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly chatGateway: ChatGateway,
  ) { }

  async getDirectConversation(
    requesterUid: string,
    uid: string,
  ) {
    const conversations = (await this.conversationRepo.query(
      `
            select
                cp1."conversationId"
            from
                conversation_participants cp1
            inner join conversation_participants cp2 
            on
                cp1."conversationId" = cp2."conversationId"
            where
                cp1."participantId" = $1
                and cp2."participantId" = $2
                and cp1."conversationId" in (
                select
                    "conversationId" 
                from
                    conversation_participants
                where
                    "participantId" = $1
            )
            limit 1
        `,
      [requesterUid, uid],
    )) as { conversationId: string }[];
    if (!conversations.length) {
      const friend = this.friendSrv.getFriend(requesterUid, uid);
      if (!friend) {
        throw new ConversationNotFoundError('Conversation not found!');
      }
      return await this.createDirectConversation(requesterUid, uid);
    }
    return this.conversationRepo.findOne({
      where: {
        id: conversations[0].conversationId,
      },
      relations: ['participants'],
    });

  }

  async getMessages(conversationId: string, uid: string, offset?: number) {
    const conversation = await this.conversationRepo.findOne({
      where: {
        id: conversationId,
        participants: {
          participantId: uid,
        }
      },
      select: ['id']
    });
    if (!conversation) {
      throw new ConversationNotFoundError('Conversation not found!');
    }
    if (!offset) {
      //set all messages as read
      await this.participantsRepo.update({
        conversationId: conversation.id,
        participantId: uid,
      }, {
        lastReadAt: new Date(),
      })
    }
    const count = await this.messageRepo.count({
      where: {
        conversation: {
          id: conversation.id,
        },
      },
    });
    const messages = await this.messageRepo.find({
      where: {
        conversation: {
          id: conversation.id,
        },
      },
      take: 50,
      skip: offset || 0,
      order: {
        sendAt: 'DESC',
      },
    });
    return {
      messages,
      nextOffset: offset + 50 < count ? offset + 50 : null,
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
        },
      ],
    });
    return {
      ...conversation,
      messages: [],
    };
  }

  async createGroupConversation(
    uids: string[],
    isSession?: boolean,
    name?: string,
  ) {
    const conversationId = crypto.randomUUID();
    const conversation = await this.conversationRepo.save({
      id: conversationId,
      name,
      type: 'group',
      isSessionConversation: isSession || false,
      participant: [
        uids.map((uid) => ({
          conversationId,
          participantId: uid,
        })),
      ],
    });
    return conversation;
  }

  async sendMessage(
    requesterUid: string,
    conversationId: string,
    message: string,
  ) {
    const conversation = await this.conversationRepo.findOne({
      where: {
        id: conversationId,
        participants: [
          {
            participantId: requesterUid,
          },
        ],
      },
      relations: ['participants'],
    });
    if (!conversation) {
      throw new ConversationNotFoundError('Conversation not found!');
    }
    const messageEntity = await this.messageRepo.save({
      conversation: {
        id: conversationId,
      },
      content: message,
      sender: requesterUid,
    });
    const fullConversation = await this.conversationRepo.findOne({
      where: {
        id: conversationId,
      },
      relations: ['participants'],
    });
    fullConversation.participants.forEach((participant) => {
      if (participant.participantId !== requesterUid) {
        this.chatGateway.wss
          .to(participant.participantId)
          .emit('message', messageEntity);
      }
    });
    return messageEntity;
  }
}
