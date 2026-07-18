import { readFile } from 'node:fs/promises';
import { ConfigService } from '@nestjs/config';
import { ChatSessionEntity } from '../../sessions/entities/chat-session.entity';
import { SandboxForkPromptService } from './sandbox-fork-prompt.service';

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
}));

describe('SandboxForkPromptService', () => {
  const readFileMock = jest.mocked(readFile);

  beforeEach(() => {
    readFileMock.mockReset();
  });

  it('builds prompt from sandbox fork skill and session runtime contract', async () => {
    readFileMock.mockResolvedValue('# Sandbox Fork Skill');
    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        SANDBOX_FORK_SKILL_PATH: '/skill/SKILL.md',
      }),
    } as unknown as ConfigService;
    const service = new SandboxForkPromptService(configService);

    await expect(
      service.buildPrompt({
        session: {
          id: 'session-id',
          routeSlug: 'meeting-feature-a',
          routePath: '/prototype/meeting-feature-a',
          prototypeDir: '/prototype-root/meeting-feature-a',
        } as ChatSessionEntity,
        targetKind: 'new',
        userPrompt: 'Làm UI meeting gọn hơn',
      }),
    ).resolves.toContain('# Sandbox Fork Skill');

    const prompt = await service.buildPrompt({
      session: {
        id: 'session-id',
        routeSlug: 'meeting-feature-a',
        routePath: '/prototype/meeting-feature-a',
        prototypeDir: '/prototype-root/meeting-feature-a',
      } as ChatSessionEntity,
      targetKind: 'new',
      userPrompt: 'Làm UI meeting gọn hơn',
    });

    expect(readFileMock).toHaveBeenCalledWith('/skill/SKILL.md', 'utf8');
    expect(prompt).toContain('targetKind: new');
    expect(prompt).toContain(
      'targetDirectory: /prototype-root/meeting-feature-a/new',
    );
    expect(prompt).toContain('Làm UI meeting gọn hơn');
    expect(prompt).toContain('Bạn phải tự đọc source code trong repo hiện tại');
    expect(prompt).toContain('PHẢI clone JSX/style từ production');
    expect(prompt).toContain('Final response ngắn gọn');
  });
});
