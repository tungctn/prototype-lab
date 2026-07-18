import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { AppConfig } from '../../../config/app.config';
import { CreateSessionDto } from '../dto/create-session.dto';
import { SessionDetailResponseDto } from '../dto/session-detail-response.dto';
import { SessionListResponseDto } from '../dto/session-list-response.dto';
import { SessionMessagesResponseDto } from '../dto/session-messages-response.dto';
import { SessionResponseDto } from '../dto/session-response.dto';
import { ChatMessageEntity } from '../entities/chat-message.entity';
import { ChatSessionEntity } from '../entities/chat-session.entity';
import { PrototypeItemEntity } from '../entities/prototype-item.entity';
import { PrototypeFilesystemService } from '../../prototype-runtime/services/prototype-filesystem.service';
import { WorkspaceService } from '../../workspace/services/workspace.service';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(ChatSessionEntity)
    private readonly sessionRepository: Repository<ChatSessionEntity>,
    @InjectRepository(ChatMessageEntity)
    private readonly messageRepository: Repository<ChatMessageEntity>,
    private readonly workspaceService: WorkspaceService,
    private readonly filesystemService: PrototypeFilesystemService,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  async createSession(dto: CreateSessionDto): Promise<SessionResponseDto> {
    const workspace =
      await this.workspaceService.getOrCreateDemoWorkspaceEntity();
    const routeSlug = await this.createUniqueRouteSlug(
      workspace.id,
      dto.title.trim(),
    );
    const prototypeDir = await this.filesystemService.ensureSessionDirectory(
      workspace.prototypeRoot,
      routeSlug,
    );
    const routePath = this.createRoutePath(routeSlug);

    const session = this.sessionRepository.create({
      workspaceId: workspace.id,
      title: dto.title.trim(),
      status: 'session_created',
      routeSlug,
      routePath,
      prototypeDir,
    });
    const savedSession = await this.sessionRepository.save(session);

    return {
      id: savedSession.id,
      title: savedSession.title,
      routeSlug: savedSession.routeSlug,
      routePath: savedSession.routePath,
      status: savedSession.status,
      createdAt: savedSession.createdAt.toISOString(),
      updatedAt: savedSession.updatedAt.toISOString(),
      items: [],
    };
  }

  async listSessions(): Promise<SessionListResponseDto> {
    const workspace =
      await this.workspaceService.getOrCreateDemoWorkspaceEntity();
    const sessions = await this.sessionRepository.find({
      where: {
        workspaceId: workspace.id,
      },
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
    });

    return {
      items: sessions.map((session) => ({
        id: session.id,
        title: session.title,
        routeSlug: session.routeSlug,
        routePath: session.routePath,
        status: session.status,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      })),
    };
  }

  async getSessionDetail(sessionId: string): Promise<SessionDetailResponseDto> {
    const session = await this.sessionRepository.findOne({
      where: {
        id: sessionId,
      },
      relations: {
        items: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      id: session.id,
      title: session.title,
      status: session.status,
      routePath: session.routePath,
      items: this.sortPrototypeItems(session.items || []).map((item) => ({
        kind: item.kind,
        url: item.url || item.routePath,
      })),
    };
  }

  async getSessionMessages(
    sessionId: string,
    limit = 50,
  ): Promise<SessionMessagesResponseDto> {
    await this.ensureSessionExists(sessionId);

    const messages = await this.messageRepository.find({
      where: {
        sessionId,
      },
      order: {
        createdAt: 'ASC',
      },
      take: limit,
    });

    return {
      items: messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        attachments: message.attachments || [],
        createdAt: message.createdAt.toISOString(),
      })),
    };
  }

  private async createUniqueRouteSlug(
    workspaceId: string,
    title: string,
  ): Promise<string> {
    const baseSlug = this.slugify(title);
    const existingCount = await this.sessionRepository.count({
      where: {
        workspaceId,
        routeSlug: Like(`${baseSlug}%`),
      },
    });

    if (existingCount === 0) {
      return baseSlug;
    }

    return `${baseSlug}-${existingCount + 1}`;
  }

  private createRoutePath(routeSlug: string): string {
    const demoConfig = this.configService.getOrThrow('DEMO', { infer: true });
    const basePath = demoConfig.PUBLIC_PROTOTYPE_BASE.replace(/\/+$/, '');

    return `${basePath}/${routeSlug}`;
  }

  private async ensureSessionExists(sessionId: string): Promise<void> {
    const exists = await this.sessionRepository.exists({
      where: {
        id: sessionId,
      },
    });

    if (!exists) {
      throw new NotFoundException('Session not found');
    }
  }

  private sortPrototypeItems(
    items: PrototypeItemEntity[],
  ): PrototypeItemEntity[] {
    const rank: Record<string, number> = {
      current: 0,
      new: 1,
    };

    return [...items].sort((first, second) => {
      return (rank[first.kind] ?? 99) - (rank[second.kind] ?? 99);
    });
  }

  private slugify(value: string): string {
    const slug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug || 'session';
  }
}
