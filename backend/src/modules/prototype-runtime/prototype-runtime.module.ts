import { Module } from '@nestjs/common';
import { CodexAgentRunnerService } from './services/codex-agent-runner.service';
import { PrototypeFilesystemService } from './services/prototype-filesystem.service';
import { SandboxForkPromptService } from './services/sandbox-fork-prompt.service';

@Module({
  providers: [
    PrototypeFilesystemService,
    SandboxForkPromptService,
    CodexAgentRunnerService,
  ],
  exports: [
    PrototypeFilesystemService,
    SandboxForkPromptService,
    CodexAgentRunnerService,
  ],
})
export class PrototypeRuntimeModule {}
