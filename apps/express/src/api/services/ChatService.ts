import TYPES from '../../lib/symbols'
import { inject, injectable } from 'inversify'
import { Repository } from 'typeorm'
import { FriendService } from './FriendService'
import { Conversation } from '../../lib/entities/conversation.entity'
import { Message } from '../../lib/entities/message.entity'
import { ConversationNotFoundError } from '../../lib/errors/chat'
import { FriendshipNotExists } from '../../lib/errors/friend'
import crypto from 'crypto'
import { Socket } from '../services/Socket'

@injectable()
export class ChatService {
  public constructor(
    @inject(TYPES.FriendService) private friendSrv: FriendService,
    @inject(TYPES.ConversationRepository) private conversationRepo: Repository<Conversation>,
    @inject(TYPES.MessageRepository) private messageRepo: Repository<Message>,
    @inject(TYPES.Socket) private socket: Socket,
  ) {
  }


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
    const conversation = await this.conversationRepo.findOne({
      where: {
        id: conversations[0].conversationId,
      },
      relations: ['participants'],
    });
    const friend = conversation.participants.find((p) => p.participantId != requesterUid)
    await this.markRead(conversation.id, requesterUid, [friend.participantId])
    return conversation;

  }

  async getMessages(conversationId: string, uid: string, offset?: number) {
    const conversation = await this.conversationRepo.findOne({
      where: {
        id: conversationId,
        participants: {
          participantId: uid,
        }
      },
      select: ['id', 'type']
    });
    if (!conversation) {
      throw new ConversationNotFoundError('Conversation not found!');
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
    for (const participant of fullConversation.participants) {
      if (participant.participantId !== requesterUid) {
        this.socket.getServer()
          .to(participant.participantId)
          .timeout(3000)
          .emit('message', messageEntity, (err, res) => {
            if (!err && res[0]?.read) {
              this.markRead(conversationId, participant.participantId, [requesterUid])
            }
          })
      }
    };
    return messageEntity;
  }

  async markRead(conversationId: string, uid: string, notify: string[] = []) {
    await this.conversationRepo.query('update "conversation_participants" set "lastReadTimestamp" = to_timestamp($3) where "conversationId" = $1 and "participantId" = $2', [conversationId, uid, new Date().getTime() / 1000])
    for (const notifyUid of notify) {
      this.socket.getServer().to(notifyUid).emit('conversation-read', { conversationId, participantId: uid })
    }
  }

}