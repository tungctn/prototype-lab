import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChatMessageEntity } from './chat-message.entity';
import { PrototypeItemEntity } from './prototype-item.entity';
import { WorkspaceEntity } from '../../workspace/entities/workspace.entity';

@Entity({ name: 'chat_sessions' })
export class ChatSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  @Index()
  workspaceId!: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 40,
    default: 'session_created',
  })
  status!: string;

  @Column({ name: 'route_slug', type: 'varchar', length: 255 })
  @Index()
  routeSlug!: string;

  @Column({ name: 'route_path', type: 'varchar', length: 255 })
  routePath!: string;

  @Column({ name: 'prototype_dir', type: 'text' })
  prototypeDir!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => WorkspaceEntity, (workspace) => workspace.sessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspace_id' })
  workspace!: WorkspaceEntity;

  @OneToMany(() => ChatMessageEntity, (message) => message.session)
  messages!: ChatMessageEntity[];

  @OneToMany(() => PrototypeItemEntity, (item) => item.session)
  items!: PrototypeItemEntity[];
}
