import { of } from 'rxjs';
import { PromptImageFile } from '../types/prompt-image-file';
import { PromptsService } from '../services/prompts.service';
import { SessionEventsService } from '../services/session-events.service';
import { SessionsService } from '../services/sessions.service';
import { SessionsController } from './sessions.controller';

describe('SessionsController', () => {
  function createController(
    sessionsServiceOverrides: Partial<SessionsService> = {},
    promptsServiceOverrides: Partial<PromptsService> = {},
    eventsServiceOverrides: Partial<SessionEventsService> = {},
  ): SessionsController {
    return new SessionsController(
      sessionsServiceOverrides as SessionsService,
      promptsServiceOverrides as PromptsService,
      eventsServiceOverrides as SessionEventsService,
    );
  }

  it('creates a session through SessionsService', async () => {
    const response = {
      id: 'session-id',
      title: 'Meeting feature A',
      routeSlug: 'meeting-feature-a',
      routePath: '/prototype/meeting-feature-a',
      status: 'session_created',
      createdAt: '2026-06-27T07:00:00.000Z',
      updatedAt: '2026-06-27T07:00:00.000Z',
      items: [],
    };
    const sessionsService = {
      createSession: jest.fn().mockResolvedValue(response),
    } as Pick<SessionsService, 'createSession'>;
    const controller = createController(sessionsService);

    await expect(
      controller.createSession({ title: 'Meeting feature A' }),
    ).resolves.toEqual(response);
    expect(sessionsService.createSession).toHaveBeenCalledWith({
      title: 'Meeting feature A',
    });
  });

  it('lists sessions through SessionsService', async () => {
    const response = {
      items: [
        {
          id: 'session-id',
          title: 'Meeting feature A',
          routeSlug: 'meeting-feature-a',
          routePath: '/prototype/meeting-feature-a',
          status: 'session_created',
          createdAt: '2026-06-27T07:00:00.000Z',
          updatedAt: '2026-06-27T07:00:00.000Z',
        },
      ],
    };
    const sessionsService = {
      listSessions: jest.fn().mockResolvedValue(response),
    } as Pick<SessionsService, 'listSessions'>;
    const controller = createController(sessionsService);

    await expect(controller.listSessions()).resolves.toEqual(response);
    expect(sessionsService.listSessions).toHaveBeenCalledTimes(1);
  });

  it('returns session detail through SessionsService', async () => {
    const response = {
      id: 'session-id',
      title: 'Meeting feature A',
      status: 'new_ready',
      routePath: '/prototype/meeting-feature-a',
      items: [
        {
          kind: 'current' as const,
          url: '/prototype/meeting-feature-a/current',
        },
        {
          kind: 'new' as const,
          url: '/prototype/meeting-feature-a/new',
        },
      ],
    };
    const sessionsService = {
      getSessionDetail: jest.fn().mockResolvedValue(response),
    } as Pick<SessionsService, 'getSessionDetail'>;
    const controller = createController(sessionsService);

    await expect(controller.getSessionDetail('session-id')).resolves.toEqual(
      response,
    );
    expect(sessionsService.getSessionDetail).toHaveBeenCalledWith('session-id');
  });

  it('returns session messages through SessionsService', async () => {
    const response = {
      items: [
        {
          id: 'message-id',
          role: 'user',
          content: 'Tôi muốn cải thiện UI này',
          createdAt: '2026-06-27T07:00:00.000Z',
        },
      ],
    };
    const sessionsService = {
      getSessionMessages: jest.fn().mockResolvedValue(response),
    } as Pick<SessionsService, 'getSessionMessages'>;
    const controller = createController(sessionsService);

    await expect(
      controller.getSessionMessages('session-id', { limit: 50 }),
    ).resolves.toEqual(response);
    expect(sessionsService.getSessionMessages).toHaveBeenCalledWith(
      'session-id',
      50,
    );
  });

  it('passes undefined limit when messages query is empty', async () => {
    const response = {
      items: [],
    };
    const sessionsService = {
      getSessionMessages: jest.fn().mockResolvedValue(response),
    } as Pick<SessionsService, 'getSessionMessages'>;
    const controller = createController(sessionsService);

    await expect(
      controller.getSessionMessages('session-id', {}),
    ).resolves.toEqual(response);
    expect(sessionsService.getSessionMessages).toHaveBeenCalledWith(
      'session-id',
      undefined,
    );
  });

  it('submits prompt through PromptsService', async () => {
    const response = {
      accepted: true as const,
      sessionId: 'session-id',
      status: 'processing' as const,
    };
    const promptsService = {
      submitPrompt: jest.fn().mockResolvedValue(response),
    } as Pick<PromptsService, 'submitPrompt'>;
    const controller = createController({}, promptsService);
    const images = [
      {
        originalname: 'screen.png',
      },
    ] as PromptImageFile[];

    await expect(
      controller.submitPrompt(
        'session-id',
        {
          content: 'Tôi cần cải thiện UI phần meeting',
        },
        images,
      ),
    ).resolves.toEqual(response);
    expect(promptsService.submitPrompt).toHaveBeenCalledWith(
      'session-id',
      {
        content: 'Tôi cần cải thiện UI phần meeting',
      },
      images,
    );
  });

  it('returns session events stream through SessionEventsService', () => {
    const eventStream = of({
      type: 'current_ready',
      data: {
        url: '/prototype/meeting-feature-a/current',
      },
    });
    const eventsService = {
      getEvents: jest.fn().mockReturnValue(eventStream),
    } as Pick<SessionEventsService, 'getEvents'>;
    const controller = createController({}, {}, eventsService);

    expect(controller.getSessionEvents('session-id')).toBe(eventStream);
    expect(eventsService.getEvents).toHaveBeenCalledWith('session-id');
  });
});
