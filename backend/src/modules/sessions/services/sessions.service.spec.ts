import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { ChatMessageEntity } from '../entities/chat-message.entity';
import { ChatSessionEntity } from '../entities/chat-session.entity';
import { PrototypeFilesystemService } from '../../prototype-runtime/services/prototype-filesystem.service';
import { WorkspaceEntity } from '../../workspace/entities/workspace.entity';
import { WorkspaceService } from '../../workspace/services/workspace.service';
import { SessionsService } from './sessions.service';

type SessionRepositoryMock = Pick<
  jest.Mocked<Repository<ChatSessionEntity>>,
  'count' | 'create' | 'exists' | 'find' | 'findOne' | 'save'
>;

type MessageRepositoryMock = Pick<
  jest.Mocked<Repository<ChatMessageEntity>>,
  'find'
>;

function routeSlugPatternMatcher(value: string): string {
  const matcher: unknown = expect.objectContaining({ _value: value });

  return matcher as string;
}

describe('SessionsService', () => {
  const workspace = {
    id: 'workspace-id',
    name: 'SNDQ Demo Workspace',
    repoName: 'sndq-fe',
    repoUrl: null,
    prototypeRoot: '/prototype-root',
    createdAt: new Date('2026-06-27T00:00:00.000Z'),
  } as WorkspaceEntity;

  let sessionRepository: SessionRepositoryMock;
  let messageRepository: MessageRepositoryMock;
  let workspaceService: jest.Mocked<
    Pick<WorkspaceService, 'getOrCreateDemoWorkspaceEntity'>
  >;
  let filesystemService: jest.Mocked<
    Pick<PrototypeFilesystemService, 'ensureSessionDirectory'>
  >;
  let configService: jest.Mocked<Pick<ConfigService, 'getOrThrow'>>;
  let service: SessionsService;

  beforeEach(() => {
    sessionRepository = {
      count: jest.fn(),
      create: jest.fn(),
      exists: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    messageRepository = {
      find: jest.fn(),
    };
    workspaceService = {
      getOrCreateDemoWorkspaceEntity: jest.fn().mockResolvedValue(workspace),
    };
    filesystemService = {
      ensureSessionDirectory: jest
        .fn()
        .mockResolvedValue('/prototype-root/meeting-feature-a'),
    };
    configService = {
      getOrThrow: jest.fn().mockReturnValue({
        PUBLIC_PROTOTYPE_BASE: '/prototype',
      }),
    };
    service = new SessionsService(
      sessionRepository as Repository<ChatSessionEntity>,
      messageRepository as Repository<ChatMessageEntity>,
      workspaceService as WorkspaceService,
      filesystemService as PrototypeFilesystemService,
      configService as ConfigService,
    );
  });

  it('returns session detail with current before new', async () => {
    sessionRepository.findOne.mockResolvedValue({
      id: 'session-id',
      title: 'Meeting feature A',
      status: 'new_ready',
      routePath: '/prototype/meeting-feature-a',
      items: [
        {
          kind: 'new',
          url: '/prototype/meeting-feature-a/new',
          routePath: '/prototype/meeting-feature-a/new',
        },
        {
          kind: 'current',
          url: '/prototype/meeting-feature-a/current',
          routePath: '/prototype/meeting-feature-a/current',
        },
      ],
    } as ChatSessionEntity);

    await expect(service.getSessionDetail('session-id')).resolves.toEqual({
      id: 'session-id',
      title: 'Meeting feature A',
      status: 'new_ready',
      routePath: '/prototype/meeting-feature-a',
      items: [
        {
          kind: 'current',
          url: '/prototype/meeting-feature-a/current',
        },
        {
          kind: 'new',
          url: '/prototype/meeting-feature-a/new',
        },
      ],
    });

    expect(sessionRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 'session-id',
      },
      relations: {
        items: true,
      },
    });
  });

  it('lists sessions for the demo workspace ordered by last update desc', async () => {
    sessionRepository.find.mockResolvedValue([
      {
        id: 'session-2',
        title: 'Session 2',
        routeSlug: 'session-2',
        routePath: '/prototype/session-2',
        status: 'processing',
        createdAt: new Date('2026-06-27T08:00:00.000Z'),
        updatedAt: new Date('2026-06-27T08:30:00.000Z'),
      },
      {
        id: 'session-1',
        title: 'Session 1',
        routeSlug: 'session-1',
        routePath: '/prototype/session-1',
        status: 'session_created',
        createdAt: new Date('2026-06-27T07:00:00.000Z'),
        updatedAt: new Date('2026-06-27T07:15:00.000Z'),
      },
    ] as ChatSessionEntity[]);

    await expect(service.listSessions()).resolves.toEqual({
      items: [
        {
          id: 'session-2',
          title: 'Session 2',
          routeSlug: 'session-2',
          routePath: '/prototype/session-2',
          status: 'processing',
          createdAt: '2026-06-27T08:00:00.000Z',
          updatedAt: '2026-06-27T08:30:00.000Z',
        },
        {
          id: 'session-1',
          title: 'Session 1',
          routeSlug: 'session-1',
          routePath: '/prototype/session-1',
          status: 'session_created',
          createdAt: '2026-06-27T07:00:00.000Z',
          updatedAt: '2026-06-27T07:15:00.000Z',
        },
      ],
    });

    expect(
      workspaceService.getOrCreateDemoWorkspaceEntity,
    ).toHaveBeenCalledTimes(1);
    expect(sessionRepository.find).toHaveBeenCalledWith({
      where: {
        workspaceId: workspace.id,
      },
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
    });
  });

  it('returns session detail with empty items when no prototype exists yet', async () => {
    sessionRepository.findOne.mockResolvedValue({
      id: 'session-id',
      title: 'Meeting feature A',
      status: 'session_created',
      routePath: '/prototype/meeting-feature-a',
      items: [],
    } as ChatSessionEntity);

    await expect(service.getSessionDetail('session-id')).resolves.toEqual({
      id: 'session-id',
      title: 'Meeting feature A',
      status: 'session_created',
      routePath: '/prototype/meeting-feature-a',
      items: [],
    });
  });

  it('uses prototype item routePath when url is null', async () => {
    sessionRepository.findOne.mockResolvedValue({
      id: 'session-id',
      title: 'Meeting feature A',
      status: 'current_ready',
      routePath: '/prototype/meeting-feature-a',
      items: [
        {
          kind: 'current',
          url: null,
          routePath: '/prototype/meeting-feature-a/current',
        },
      ],
    } as ChatSessionEntity);

    await expect(service.getSessionDetail('session-id')).resolves.toEqual({
      id: 'session-id',
      title: 'Meeting feature A',
      status: 'current_ready',
      routePath: '/prototype/meeting-feature-a',
      items: [
        {
          kind: 'current',
          url: '/prototype/meeting-feature-a/current',
        },
      ],
    });
  });

  it('throws when session detail does not exist', async () => {
    sessionRepository.findOne.mockResolvedValue(null);

    await expect(service.getSessionDetail('missing-session')).rejects.toThrow(
      'Session not found',
    );
  });

  it('returns session messages ordered by createdAt asc with limit', async () => {
    const createdAt = new Date('2026-06-27T07:00:00.000Z');

    sessionRepository.exists.mockResolvedValue(true);
    messageRepository.find.mockResolvedValue([
      {
        id: 'message-id',
        role: 'user',
        content: 'Tôi muốn cải thiện UI này',
        attachments: [
          {
            type: 'image',
            filename: 'screen.png',
            mimeType: 'image/png',
            path: '/uploads/screen.png',
            size: 5,
          },
        ],
        createdAt,
      } as ChatMessageEntity,
    ]);

    await expect(service.getSessionMessages('session-id', 50)).resolves.toEqual(
      {
        items: [
          {
            id: 'message-id',
            role: 'user',
            content: 'Tôi muốn cải thiện UI này',
            attachments: [
              {
                type: 'image',
                filename: 'screen.png',
                mimeType: 'image/png',
                path: '/uploads/screen.png',
                size: 5,
              },
            ],
            createdAt: '2026-06-27T07:00:00.000Z',
          },
        ],
      },
    );

    expect(sessionRepository.exists).toHaveBeenCalledWith({
      where: {
        id: 'session-id',
      },
    });
    expect(messageRepository.find).toHaveBeenCalledWith({
      where: {
        sessionId: 'session-id',
      },
      order: {
        createdAt: 'ASC',
      },
      take: 50,
    });
  });

  it('throws when listing messages for a missing session', async () => {
    sessionRepository.exists.mockResolvedValue(false);

    await expect(service.getSessionMessages('missing-session')).rejects.toThrow(
      'Session not found',
    );
    expect(messageRepository.find).not.toHaveBeenCalled();
  });

  it('returns empty message list when session exists but has no messages', async () => {
    sessionRepository.exists.mockResolvedValue(true);
    messageRepository.find.mockResolvedValue([]);

    await expect(service.getSessionMessages('session-id')).resolves.toEqual({
      items: [],
    });

    expect(messageRepository.find).toHaveBeenCalledWith({
      where: {
        sessionId: 'session-id',
      },
      order: {
        createdAt: 'ASC',
      },
      take: 50,
    });
  });

  it('creates a session row and folder without current/new items', async () => {
    const unsavedSession = {
      workspaceId: workspace.id,
      title: 'Meeting feature A',
      status: 'session_created',
      routeSlug: 'meeting-feature-a',
      routePath: '/prototype/meeting-feature-a',
      prototypeDir: '/prototype-root/meeting-feature-a',
    } as ChatSessionEntity;
    const savedSession = {
      ...unsavedSession,
      id: 'session-id',
      createdAt: new Date('2026-06-27T00:00:00.000Z'),
      updatedAt: new Date('2026-06-27T00:00:00.000Z'),
    };

    sessionRepository.count.mockResolvedValue(0);
    sessionRepository.create.mockReturnValue(unsavedSession);
    sessionRepository.save.mockResolvedValue(savedSession);

    await expect(
      service.createSession({ title: 'Meeting feature A' }),
    ).resolves.toEqual({
      id: 'session-id',
      title: 'Meeting feature A',
      routeSlug: 'meeting-feature-a',
      routePath: '/prototype/meeting-feature-a',
      status: 'session_created',
      createdAt: '2026-06-27T00:00:00.000Z',
      updatedAt: '2026-06-27T00:00:00.000Z',
      items: [],
    });

    expect(
      workspaceService.getOrCreateDemoWorkspaceEntity,
    ).toHaveBeenCalledTimes(1);
    expect(sessionRepository.count).toHaveBeenCalledWith({
      where: {
        workspaceId: workspace.id,
        routeSlug: routeSlugPatternMatcher('meeting-feature-a%'),
      },
    });
    expect(filesystemService.ensureSessionDirectory).toHaveBeenCalledWith(
      '/prototype-root',
      'meeting-feature-a',
    );
    expect(sessionRepository.create).toHaveBeenCalledWith(unsavedSession);
    expect(sessionRepository.save).toHaveBeenCalledWith(unsavedSession);
  });

  it('normalizes Vietnamese titles into ASCII route slugs', async () => {
    const unsavedSession = {
      workspaceId: workspace.id,
      title: 'Cải thiện UI',
      status: 'session_created',
      routeSlug: 'cai-thien-ui',
      routePath: '/prototype/cai-thien-ui',
      prototypeDir: '/prototype-root/cai-thien-ui',
    } as ChatSessionEntity;

    sessionRepository.count.mockResolvedValue(0);
    filesystemService.ensureSessionDirectory.mockResolvedValue(
      '/prototype-root/cai-thien-ui',
    );
    sessionRepository.create.mockReturnValue(unsavedSession);
    const savedSession = {
      ...unsavedSession,
      id: 'session-id',
      createdAt: new Date('2026-06-27T00:00:00.000Z'),
      updatedAt: new Date('2026-06-27T00:00:00.000Z'),
    };
    sessionRepository.save.mockResolvedValue(savedSession);

    await expect(
      service.createSession({ title: '  Cải thiện UI  ' }),
    ).resolves.toEqual({
      id: 'session-id',
      title: 'Cải thiện UI',
      routeSlug: 'cai-thien-ui',
      routePath: '/prototype/cai-thien-ui',
      status: 'session_created',
      createdAt: '2026-06-27T00:00:00.000Z',
      updatedAt: '2026-06-27T00:00:00.000Z',
      items: [],
    });

    expect(filesystemService.ensureSessionDirectory).toHaveBeenCalledWith(
      '/prototype-root',
      'cai-thien-ui',
    );
  });

  it('does not duplicate slash when public prototype base ends with slash', async () => {
    const unsavedSession = {
      workspaceId: workspace.id,
      title: 'Meeting feature A',
      status: 'session_created',
      routeSlug: 'meeting-feature-a',
      routePath: '/prototype/meeting-feature-a',
      prototypeDir: '/prototype-root/meeting-feature-a',
    } as ChatSessionEntity;

    configService.getOrThrow.mockReturnValue({
      PUBLIC_PROTOTYPE_BASE: '/prototype/',
    });
    sessionRepository.count.mockResolvedValue(0);
    sessionRepository.create.mockReturnValue(unsavedSession);
    sessionRepository.save.mockResolvedValue({
      ...unsavedSession,
      id: 'session-id',
      createdAt: new Date('2026-06-27T00:00:00.000Z'),
      updatedAt: new Date('2026-06-27T00:00:00.000Z'),
    });

    await service.createSession({ title: 'Meeting feature A' });

    expect(sessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        routePath: '/prototype/meeting-feature-a',
      }),
    );
  });

  it('adds a numeric suffix when the slug already exists', async () => {
    const unsavedSession = {
      workspaceId: workspace.id,
      title: 'Meeting feature A',
      status: 'session_created',
      routeSlug: 'meeting-feature-a-2',
      routePath: '/prototype/meeting-feature-a-2',
      prototypeDir: '/prototype-root/meeting-feature-a-2',
    } as ChatSessionEntity;

    sessionRepository.count.mockResolvedValue(1);
    filesystemService.ensureSessionDirectory.mockResolvedValue(
      '/prototype-root/meeting-feature-a-2',
    );
    sessionRepository.create.mockReturnValue(unsavedSession);
    sessionRepository.save.mockResolvedValue({
      ...unsavedSession,
      id: 'session-id-2',
      createdAt: new Date('2026-06-27T00:00:00.000Z'),
      updatedAt: new Date('2026-06-27T00:00:00.000Z'),
    });

    await service.createSession({ title: 'Meeting feature A' });

    expect(filesystemService.ensureSessionDirectory).toHaveBeenCalledWith(
      '/prototype-root',
      'meeting-feature-a-2',
    );
    expect(sessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        routeSlug: 'meeting-feature-a-2',
        routePath: '/prototype/meeting-feature-a-2',
      }),
    );
  });
});
