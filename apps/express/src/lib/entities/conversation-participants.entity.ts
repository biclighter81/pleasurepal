import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryColumn } from "typeorm";
import { Conversation } from "./conversation.entity";

@Entity()
export class ConversationParticipants {
    @PrimaryColumn()
    conversationId: string;
    @PrimaryColumn()
    participantId: string;
    @Column({ nullable: true, type: 'timestamp' })
    lastReadTimestamp: Date;
    @ManyToOne(() => Conversation, conversation => conversation.participants)
    @JoinColumn({ name: 'conversationId' })
    conversation: Conversation;
}