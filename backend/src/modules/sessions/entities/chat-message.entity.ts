import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatSessionEntity } from './chat-session.entity';
import { ChatMessageAttachment } from '../types/chat-message-attachment';

@Entity({ name: 'chat_messages' })
export class ChatMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'session_id', type: 'uuid' })
  @Index()
  sessionId!: string;

  @Column({ name: 'role', type: 'varchar', length: 20 })
  role!: string;

  @Column({ name: 'content', type: 'text' })
  content!: string;

  @Column({ name: 'attachments', type: 'jsonb', default: () => "'[]'" })
  attachments!: ChatMessageAttachment[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => ChatSessionEntity, (session) => session.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session!: ChatSessionEntity;
}
