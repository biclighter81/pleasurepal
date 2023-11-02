import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Conversation } from "./conversation.entity";

@Entity()
export class Message {
    @PrimaryGeneratedColumn("uuid")
    id: string;
    @Column()
    sender: string;
    @Column({ type: 'json' })
    content: string;
    @UpdateDateColumn()
    updatedAt: Date;
    @CreateDateColumn()
    sendAt: Date;

    @ManyToOne(() => Conversation, conversation => conversation.messages)
    conversation: Conversation;
}