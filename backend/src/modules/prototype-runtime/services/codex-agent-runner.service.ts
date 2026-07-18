import { spawn } from 'node:child_process';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../config/app.config';

type RunAgentParams = {
  prompt: string;
  images: string[];
  onDelta?: (delta: string) => void;
};

@Injectable()
export class CodexAgentRunnerService {
  private readonly logger = new Logger(CodexAgentRunnerService.name);

  constructor(private readonly configService: ConfigService<AppConfig>) {}

  run(params: RunAgentParams): Promise<void> {
    const agentConfig = this.configService.getOrThrow('AGENT', {
      infer: true,
    });
    const args = [
      'exec',
      '--json',
      '--cd',
      agentConfig.FRONTEND_REPO_PATH,
      '--sandbox',
      'workspace-write',
      ...this.createModelArgs(agentConfig.MODEL),
      ...params.images.flatMap((image) => ['--image', image]),
      '-',
    ];

    this.logger.log(
      `Codex agent started command=${agentConfig.COMMAND} cwd=${agentConfig.FRONTEND_REPO_PATH} images=${params.images.length}`,
    );

    return new Promise((resolve, reject) => {
      const child = spawn(agentConfig.COMMAND, args, {
        cwd: agentConfig.FRONTEND_REPO_PATH,
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stderr = '';

      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', (chunk: string) => {
        this.handleStdout(chunk, params.onDelta);
      });
      child.stderr.on('data', (chunk: string) => {
        stderr += chunk;
        this.handleStderr(chunk, params.onDelta);
      });
      child.on('error', (error) => {
        reject(error);
      });
      child.on('close', (code) => {
        if (code === 0) {
          this.logger.log('Codex agent completed');
          resolve();
          return;
        }

        reject(new Error(`Codex agent exited with code ${code}: ${stderr}`));
      });
      child.stdin.end(params.prompt);
    });
  }

  private createModelArgs(model?: string): string[] {
    return model ? ['--model', model] : [];
  }

  private handleStdout(chunk: string, onDelta?: (delta: string) => void): void {
    for (const line of chunk.split('\n')) {
      if (!line.trim()) {
        continue;
      }

      const message = this.extractCodexMessage(line);

      if (!message) {
        continue;
      }
      this.logger.log(`[codex] ${message}`);
      onDelta?.(message);
    }
  }

  private handleStderr(chunk: string, onDelta?: (delta: string) => void): void {
    for (const line of chunk.split('\n')) {
      if (!line.trim()) {
        continue;
      }

      this.logger.warn(`[codex:stderr] ${line}`);
      onDelta?.(line);
    }
  }

  private extractCodexMessage(line: string): string | null {
    try {
      const event = JSON.parse(line) as Record<string, unknown>;
      return this.findDisplayText(event);
    } catch {
      return line;
    }
  }

  private findDisplayText(value: unknown): string | null {
    if (Array.isArray(value)) {
      for (const item of value) {
        const nestedText = this.findDisplayText(item);

        if (nestedText) {
          return nestedText;
        }
      }

      return null;
    }

    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;

    for (const key of ['message', 'text', 'delta', 'content', 'summary']) {
      const candidate = record[key];

      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate;
      }
    }

    for (const nestedValue of Object.values(record)) {
      const nestedText = this.findDisplayText(nestedValue);

      if (nestedText) {
        return nestedText;
      }
    }

    return null;
  }
}
