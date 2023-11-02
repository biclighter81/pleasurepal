import { Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryColumn } from "typeorm";
import { Conversation } from "./conversation.entity";

@Entity()
export class ConversationParticipants {
    @PrimaryColumn()
    conversationId: string;
    @PrimaryColumn()
    participantId: string;
    @ManyToOne(() => Conversation, conversation => conversation.participants)
    @JoinColumn({ name: 'conversationId' })
    conversation: Conversation;
}