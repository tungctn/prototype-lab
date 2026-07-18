import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromptAcceptedResponseDto } from '../dto/prompt-accepted-response.dto';
import { SubmitPromptDto } from '../dto/submit-prompt.dto';
import { ChatMessageEntity } from '../entities/chat-message.entity';
import { ChatSessionEntity } from '../entities/chat-session.entity';
import { PrototypeItemEntity } from '../entities/prototype-item.entity';
import { ChatMessageAttachment } from '../types/chat-message-attachment';
import { PromptImageFile } from '../types/prompt-image-file';
import { CodexAgentRunnerService } from '../../prototype-runtime/services/codex-agent-runner.service';
import { PrototypeFilesystemService } from '../../prototype-runtime/services/prototype-filesystem.service';
import { SandboxForkPromptService } from '../../prototype-runtime/services/sandbox-fork-prompt.service';
import { SessionEventsService } from './session-events.service';

@Injectable()
export class PromptsService {
  private readonly logger = new Logger(PromptsService.name);

  constructor(
    @InjectRepository(ChatSessionEntity)
    private readonly sessionRepository: Repository<ChatSessionEntity>,
    @InjectRepository(ChatMessageEntity)
    private readonly messageRepository: Repository<ChatMessageEntity>,
    @InjectRepository(PrototypeItemEntity)
    private readonly prototypeItemRepository: Repository<PrototypeItemEntity>,
    private readonly filesystemService: PrototypeFilesystemService,
    private readonly eventsService: SessionEventsService,
    private readonly sandboxForkPromptService: SandboxForkPromptService,
    private readonly codexAgentRunnerService: CodexAgentRunnerService,
  ) {}

  async submitPrompt(
    sessionId: string,
    dto: SubmitPromptDto,
    images: PromptImageFile[] = [],
  ): Promise<PromptAcceptedResponseDto> {
    const session = await this.sessionRepository.findOne({
      where: {
        id: sessionId,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const content = dto.content.trim();
    const attachments = await this.filesystemService.savePromptImages(
      session.prototypeDir,
      images,
    );

    await this.messageRepository.save(
      this.messageRepository.create({
        sessionId,
        role: 'user',
        content,
        attachments,
      }),
    );
    await this.sessionRepository.update(sessionId, {
      status: 'processing',
    });
    this.eventsService.emit(sessionId, 'session_status', {
      status: 'processing',
      message: 'Đang xử lý prompt',
    });

    setImmediate(() => {
      void this.processPromptTask(sessionId, content, attachments);
    });

    return {
      accepted: true,
      sessionId,
      status: 'processing',
    };
  }

  private async processPromptTask(
    sessionId: string,
    content: string,
    attachments: ChatMessageAttachment[],
  ): Promise<void> {
    try {
      const session = await this.sessionRepository.findOne({
        where: {
          id: sessionId,
        },
        relations: {
          items: true,
        },
      });

      if (!session) {
        return;
      }

      const hasCurrent = (session.items || []).some(
        (item) => item.kind === 'current',
      );

      if (!hasCurrent) {
        await this.createCurrentPrototype(session, content, attachments);
        return;
      }

      await this.createNewPrototype(session, content, attachments);
    } catch (error) {
      this.logger.error(
        `Codex agent failed session=${sessionId}`,
        error instanceof Error ? error.stack : undefined,
      );
      await this.sessionRepository.update(sessionId, {
        status: 'error',
      });
      this.eventsService.emit(sessionId, 'session_status', {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async createCurrentPrototype(
    session: ChatSessionEntity,
    content: string,
    attachments: ChatMessageAttachment[],
  ): Promise<void> {
    const url = `${session.routePath}/current`;

    this.eventsService.emit(session.id, 'session_status', {
      status: 'processing',
      message: 'Đang gọi Codex để tạo current prototype',
    });
    const prompt = await this.sandboxForkPromptService.buildPrompt({
      session,
      targetKind: 'current',
      userPrompt: content,
    });
    await this.filesystemService.createCurrentPrototype(
      session.prototypeDir,
      [],
    );
    await this.codexAgentRunnerService.run({
      prompt,
      images: attachments.map((attachment) => attachment.path),
      onDelta: (delta) => this.emitAiDelta(session.id, delta),
    });
    await this.upsertPrototypeItem(session, 'current', url);
    await this.sessionRepository.update(session.id, {
      status: 'current_ready',
    });
    this.eventsService.emit(session.id, 'current_ready', {
      url,
    });
  }

  private async createNewPrototype(
    session: ChatSessionEntity,
    content: string,
    attachments: ChatMessageAttachment[],
  ): Promise<void> {
    const url = `${session.routePath}/new`;

    this.eventsService.emit(session.id, 'new_reloading', {
      message: 'Đang gọi Codex để tạo bản new',
    });
    const prompt = await this.sandboxForkPromptService.buildPrompt({
      session,
      targetKind: 'new',
      userPrompt: content,
    });
    await this.filesystemService.copyCurrentToNew(session.prototypeDir);
    await this.codexAgentRunnerService.run({
      prompt,
      images: attachments.map((attachment) => attachment.path),
      onDelta: (delta) => this.emitAiDelta(session.id, delta),
    });
    await this.upsertPrototypeItem(session, 'new', url);
    await this.sessionRepository.update(session.id, {
      status: 'new_ready',
    });
    this.eventsService.emit(session.id, 'new_ready', {
      url,
    });
  }

  private async upsertPrototypeItem(
    session: ChatSessionEntity,
    kind: 'current' | 'new',
    url: string,
  ): Promise<void> {
    const existingItem = await this.prototypeItemRepository.findOne({
      where: {
        sessionId: session.id,
        kind,
      },
    });
    const item = this.prototypeItemRepository.create({
      ...(existingItem || {}),
      sessionId: session.id,
      kind,
      title: kind === 'current' ? 'Current prototype' : 'New prototype',
      status: 'saved',
      routeSlug: `${session.routeSlug}-${kind}`,
      routePath: url,
      url,
    });

    await this.prototypeItemRepository.save(item);
  }

  private emitAiDelta(sessionId: string, delta: string): void {
    this.eventsService.emit(sessionId, 'ai_delta', {
      delta,
    });
    this.logger.log(`[codex:${sessionId}] ${delta}`);
  }
}
