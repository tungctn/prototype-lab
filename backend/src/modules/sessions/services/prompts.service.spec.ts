import { Repository } from 'typeorm';
import { ChatMessageEntity } from '../entities/chat-message.entity';
import { ChatSessionEntity } from '../entities/chat-session.entity';
import { PrototypeItemEntity } from '../entities/prototype-item.entity';
import { PromptImageFile } from '../types/prompt-image-file';
import { CodexAgentRunnerService } from '../../prototype-runtime/services/codex-agent-runner.service';
import { PrototypeFilesystemService } from '../../prototype-runtime/services/prototype-filesystem.service';
import { SandboxForkPromptService } from '../../prototype-runtime/services/sandbox-fork-prompt.service';
import { PromptsService } from './prompts.service';
import { SessionEventsService } from './session-events.service';

type SessionRepositoryMock = Pick<
  jest.Mocked<Repository<ChatSessionEntity>>,
  'findOne' | 'update'
>;

type MessageRepositoryMock = Pick<
  jest.Mocked<Repository<ChatMessageEntity>>,
  'create' | 'save'
>;

type PrototypeItemRepositoryMock = Pick<
  jest.Mocked<Repository<PrototypeItemEntity>>,
  'create' | 'findOne' | 'save'
>;

async function flushAsyncTask(): Promise<void> {
  for (let index = 0; index < 8; index += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

function sessionWithIdMatcher(id: string): ChatSessionEntity {
  const matcher: unknown = expect.objectContaining({ id });

  return matcher as ChatSessionEntity;
}

function deltaHandlerMatcher(): (delta: string) => void {
  const matcher: unknown = expect.any(Function);

  return matcher as (delta: string) => void;
}

describe('PromptsService', () => {
  const baseSession = {
    id: 'session-id',
    title: 'Meeting feature A',
    status: 'session_created',
    routeSlug: 'meeting-feature-a',
    routePath: '/prototype/meeting-feature-a',
    prototypeDir: '/prototype-root/meeting-feature-a',
  } as ChatSessionEntity;

  let sessionRepository: SessionRepositoryMock;
  let messageRepository: MessageRepositoryMock;
  let prototypeItemRepository: PrototypeItemRepositoryMock;
  let filesystemService: jest.Mocked<
    Pick<
      PrototypeFilesystemService,
      'copyCurrentToNew' | 'createCurrentPrototype' | 'savePromptImages'
    >
  >;
  let eventsService: jest.Mocked<Pick<SessionEventsService, 'emit'>>;
  let sandboxForkPromptService: jest.Mocked<
    Pick<SandboxForkPromptService, 'buildPrompt'>
  >;
  let codexAgentRunnerService: jest.Mocked<
    Pick<CodexAgentRunnerService, 'run'>
  >;
  let service: PromptsService;

  beforeEach(() => {
    sessionRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    messageRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };
    prototypeItemRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    filesystemService = {
      copyCurrentToNew: jest.fn(),
      createCurrentPrototype: jest.fn(),
      savePromptImages: jest.fn().mockResolvedValue([]),
    };
    eventsService = {
      emit: jest.fn(),
    };
    sandboxForkPromptService = {
      buildPrompt: jest.fn().mockResolvedValue('sandbox fork prompt'),
    };
    codexAgentRunnerService = {
      run: jest
        .fn()
        .mockImplementation(
          ({ onDelta }: { onDelta?: (delta: string) => void }) => {
            onDelta?.('codex chunk');
            return Promise.resolve();
          },
        ),
    };
    service = new PromptsService(
      sessionRepository as Repository<ChatSessionEntity>,
      messageRepository as Repository<ChatMessageEntity>,
      prototypeItemRepository as Repository<PrototypeItemEntity>,
      filesystemService as PrototypeFilesystemService,
      eventsService as SessionEventsService,
      sandboxForkPromptService as SandboxForkPromptService,
      codexAgentRunnerService as CodexAgentRunnerService,
    );
  });

  it('throws when submitting prompt to a missing session', async () => {
    sessionRepository.findOne.mockResolvedValue(null);

    await expect(
      service.submitPrompt('missing-session', { content: 'hello' }),
    ).rejects.toThrow('Session not found');

    expect(messageRepository.save).not.toHaveBeenCalled();
    expect(sessionRepository.update).not.toHaveBeenCalled();
    expect(eventsService.emit).not.toHaveBeenCalled();
  });

  it('accepts prompt quickly and creates current prototype when session has no current', async () => {
    const userMessage = {
      sessionId: 'session-id',
      role: 'user',
      content: 'Tôi cần cải thiện UI phần meeting',
      attachments: [],
    } as ChatMessageEntity;
    const currentItem = {
      sessionId: 'session-id',
      kind: 'current',
      url: '/prototype/meeting-feature-a/current',
    } as PrototypeItemEntity;

    sessionRepository.findOne
      .mockResolvedValueOnce(baseSession)
      .mockResolvedValueOnce({
        ...baseSession,
        items: [],
      });
    messageRepository.create.mockReturnValue(userMessage);
    prototypeItemRepository.findOne.mockResolvedValue(null);
    prototypeItemRepository.create.mockReturnValue(currentItem);

    await expect(
      service.submitPrompt('session-id', {
        content: 'Tôi cần cải thiện UI phần meeting',
      }),
    ).resolves.toEqual({
      accepted: true,
      sessionId: 'session-id',
      status: 'processing',
    });

    expect(messageRepository.save).toHaveBeenCalledWith(userMessage);
    expect(sessionRepository.update).toHaveBeenCalledWith('session-id', {
      status: 'processing',
    });
    expect(eventsService.emit).toHaveBeenCalledWith(
      'session-id',
      'session_status',
      {
        status: 'processing',
        message: 'Đang xử lý prompt',
      },
    );

    await flushAsyncTask();

    expect(sandboxForkPromptService.buildPrompt).toHaveBeenCalledWith({
      session: sessionWithIdMatcher('session-id'),
      targetKind: 'current',
      userPrompt: 'Tôi cần cải thiện UI phần meeting',
    });
    expect(filesystemService.createCurrentPrototype).toHaveBeenCalledWith(
      '/prototype-root/meeting-feature-a',
      [],
    );
    expect(codexAgentRunnerService.run).toHaveBeenCalledWith({
      prompt: 'sandbox fork prompt',
      images: [],
      onDelta: deltaHandlerMatcher(),
    });
    expect(eventsService.emit).toHaveBeenCalledWith('session-id', 'ai_delta', {
      delta: 'codex chunk',
    });
    expect(prototypeItemRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'current',
        routePath: '/prototype/meeting-feature-a/current',
        url: '/prototype/meeting-feature-a/current',
      }),
    );
    expect(prototypeItemRepository.save).toHaveBeenCalledWith(currentItem);
    expect(sessionRepository.update).toHaveBeenCalledWith('session-id', {
      status: 'current_ready',
    });
    expect(eventsService.emit).toHaveBeenCalledWith(
      'session-id',
      'current_ready',
      {
        url: '/prototype/meeting-feature-a/current',
      },
    );
  });

  it('saves uploaded images and passes image paths to Codex', async () => {
    const image = {
      originalname: 'screen.png',
      mimetype: 'image/png',
      buffer: Buffer.from('image'),
      size: 5,
    } as PromptImageFile;
    const attachment = {
      type: 'image' as const,
      filename: 'screen.png',
      mimeType: 'image/png',
      path: '/prototype-root/meeting-feature-a/_uploads/screen.png',
      size: 5,
    };

    sessionRepository.findOne
      .mockResolvedValueOnce(baseSession)
      .mockResolvedValueOnce({
        ...baseSession,
        items: [],
      });
    filesystemService.savePromptImages.mockResolvedValue([attachment]);
    messageRepository.create.mockReturnValue({} as ChatMessageEntity);
    prototypeItemRepository.findOne.mockResolvedValue(null);
    prototypeItemRepository.create.mockReturnValue({} as PrototypeItemEntity);

    await service.submitPrompt(
      'session-id',
      {
        content: 'Sửa theo ảnh',
      },
      [image],
    );
    await flushAsyncTask();

    expect(filesystemService.savePromptImages).toHaveBeenCalledWith(
      '/prototype-root/meeting-feature-a',
      [image],
    );
    expect(messageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [attachment],
      }),
    );
    expect(codexAgentRunnerService.run).toHaveBeenCalledWith({
      prompt: 'sandbox fork prompt',
      images: ['/prototype-root/meeting-feature-a/_uploads/screen.png'],
      onDelta: deltaHandlerMatcher(),
    });
  });

  it('copies current to new and runs Codex when current already exists', async () => {
    const newItem = {
      sessionId: 'session-id',
      kind: 'new',
      url: '/prototype/meeting-feature-a/new',
    } as PrototypeItemEntity;

    sessionRepository.findOne
      .mockResolvedValueOnce(baseSession)
      .mockResolvedValueOnce({
        ...baseSession,
        items: [
          {
            kind: 'current',
          },
        ],
      } as ChatSessionEntity);
    messageRepository.create.mockReturnValue({} as ChatMessageEntity);
    prototypeItemRepository.findOne.mockResolvedValue(null);
    prototypeItemRepository.create.mockReturnValue(newItem);

    await service.submitPrompt('session-id', {
      content: 'Làm UI meeting gọn hơn',
    });
    await flushAsyncTask();

    expect(sandboxForkPromptService.buildPrompt).toHaveBeenCalledWith({
      session: sessionWithIdMatcher('session-id'),
      targetKind: 'new',
      userPrompt: 'Làm UI meeting gọn hơn',
    });
    expect(filesystemService.copyCurrentToNew).toHaveBeenCalledWith(
      '/prototype-root/meeting-feature-a',
    );
    expect(codexAgentRunnerService.run).toHaveBeenCalledWith({
      prompt: 'sandbox fork prompt',
      images: [],
      onDelta: deltaHandlerMatcher(),
    });
    expect(prototypeItemRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'new',
        routePath: '/prototype/meeting-feature-a/new',
        url: '/prototype/meeting-feature-a/new',
      }),
    );
    expect(sessionRepository.update).toHaveBeenCalledWith('session-id', {
      status: 'new_ready',
    });
    expect(eventsService.emit).toHaveBeenCalledWith('session-id', 'new_ready', {
      url: '/prototype/meeting-feature-a/new',
    });
  });

  it('marks session as error and emits error status when async task fails', async () => {
    sessionRepository.findOne
      .mockResolvedValueOnce(baseSession)
      .mockResolvedValueOnce({
        ...baseSession,
        items: [],
      });
    messageRepository.create.mockReturnValue({} as ChatMessageEntity);
    codexAgentRunnerService.run.mockRejectedValue(
      new Error('sandbox fork failed'),
    );

    await service.submitPrompt('session-id', {
      content: 'Tạo current',
    });
    await flushAsyncTask();

    expect(sessionRepository.update).toHaveBeenCalledWith('session-id', {
      status: 'error',
    });
    expect(eventsService.emit).toHaveBeenCalledWith(
      'session-id',
      'session_status',
      {
        status: 'error',
        message: 'sandbox fork failed',
      },
    );
  });
});
