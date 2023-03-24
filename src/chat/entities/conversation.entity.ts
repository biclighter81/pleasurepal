import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ConversationParticipants } from "./conversation-participants.entity";
import { Message } from "./message.entity";

@Entity('conversation')
export class Conversation {
    @PrimaryColumn()
    id: string;
    @Column({ nullable: true })
    name: string;
    @Column({ enum: ['direct', 'group'], default: 'direct' })
    type: string;
    @UpdateDateColumn()
    updatedAt: Date;
    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => Message, message => message.conversation, { cascade: true })
    messages: Message[];
    @OneToMany(() => ConversationParticipants, conversationParticipants => conversationParticipants.conversation, { cascade: true })
    participants: ConversationParticipants[];
}