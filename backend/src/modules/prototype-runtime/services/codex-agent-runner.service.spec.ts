import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../config/app.config';
import { CodexAgentRunnerService } from './codex-agent-runner.service';

jest.mock('node:child_process', () => ({
  spawn: jest.fn(),
}));

type MockChildProcess = EventEmitter & {
  stdout: EventEmitter & {
    setEncoding: jest.Mock;
  };
  stderr: EventEmitter & {
    setEncoding: jest.Mock;
  };
  stdin: {
    end: jest.Mock;
  };
};

function createMockChildProcess(): MockChildProcess {
  const child = new EventEmitter() as MockChildProcess;

  child.stdout = new EventEmitter() as MockChildProcess['stdout'];
  child.stderr = new EventEmitter() as MockChildProcess['stderr'];
  child.stdout.setEncoding = jest.fn();
  child.stderr.setEncoding = jest.fn();
  child.stdin = {
    end: jest.fn(),
  };

  return child;
}

describe('CodexAgentRunnerService', () => {
  let service: CodexAgentRunnerService;
  let child: MockChildProcess;

  beforeEach(() => {
    child = createMockChildProcess();
    jest.mocked(spawn).mockReturnValue(child as never);

    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        COMMAND: 'codex',
        MODEL: undefined,
        FRONTEND_REPO_PATH: '/repo/sndq-fe',
      }),
    } as unknown as ConfigService<AppConfig>;

    service = new CodexAgentRunnerService(configService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('spawns codex exec with repo cwd, images, and prompt over stdin', async () => {
    const pending = service.run({
      prompt: 'sandbox fork prompt',
      images: ['/tmp/screen.png'],
    });

    expect(spawn).toHaveBeenCalledWith(
      'codex',
      [
        'exec',
        '--json',
        '--cd',
        '/repo/sndq-fe',
        '--sandbox',
        'workspace-write',
        '--image',
        '/tmp/screen.png',
        '-',
      ],
      {
        cwd: '/repo/sndq-fe',
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    expect(child.stdin.end).toHaveBeenCalledWith('sandbox fork prompt');

    child.emit('close', 0);

    await expect(pending).resolves.toBeUndefined();
  });

  it('streams codex stdout and stderr lines to delta callback', async () => {
    const onDelta = jest.fn();
    const pending = service.run({
      prompt: 'sandbox fork prompt',
      images: [],
      onDelta,
    });

    child.stdout.emit(
      'data',
      '{"message":"Đang đọc source"}\n{"type":"event"}\n{"payload":{"delta":"Đang sửa file"}}\nraw line\n',
    );
    child.stderr.emit('data', 'warning line\n');
    child.emit('close', 0);

    await pending;

    expect(onDelta).toHaveBeenCalledWith('Đang đọc source');
    expect(onDelta).not.toHaveBeenCalledWith('{"type":"event"}');
    expect(onDelta).toHaveBeenCalledWith('Đang sửa file');
    expect(onDelta).toHaveBeenCalledWith('raw line');
    expect(onDelta).toHaveBeenCalledWith('warning line');
  });

  it('rejects when codex exits with non-zero code', async () => {
    const pending = service.run({
      prompt: 'sandbox fork prompt',
      images: [],
    });

    child.stderr.emit('data', 'permission denied\n');
    child.emit('close', 1);

    await expect(pending).rejects.toThrow(
      'Codex agent exited with code 1: permission denied',
    );
  });
});
