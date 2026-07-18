import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChatSessionEntity } from './chat-session.entity';

@Entity({ name: 'prototype_items' })
export class PrototypeItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'session_id', type: 'uuid' })
  @Index()
  sessionId!: string;

  @Column({ name: 'kind', type: 'varchar', length: 20 })
  kind!: 'current' | 'new';

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'status', type: 'varchar', length: 40, default: 'saved' })
  status!: string;

  @Column({ name: 'route_slug', type: 'varchar', length: 255 })
  routeSlug!: string;

  @Column({ name: 'route_path', type: 'varchar', length: 255 })
  routePath!: string;

  @Column({ name: 'url', type: 'text', nullable: true })
  url!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => ChatSessionEntity, (session) => session.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session!: ChatSessionEntity;
}
