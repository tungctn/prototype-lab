import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatSessionEntity } from '../../sessions/entities/chat-session.entity';

@Entity({ name: 'workspaces' })
export class WorkspaceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'repo_name', type: 'varchar', length: 255 })
  repoName!: string;

  @Column({ name: 'repo_url', type: 'text', nullable: true })
  repoUrl!: string | null;

  @Column({ name: 'prototype_root', type: 'text' })
  prototypeRoot!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => ChatSessionEntity, (session) => session.workspace)
  sessions!: ChatSessionEntity[];
}
