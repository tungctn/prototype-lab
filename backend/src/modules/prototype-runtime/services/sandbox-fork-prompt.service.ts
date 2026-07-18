import { readFile } from 'node:fs/promises';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../config/app.config';
import { ChatSessionEntity } from '../../sessions/entities/chat-session.entity';

type BuildPromptParams = {
  session: ChatSessionEntity;
  targetKind: 'current' | 'new';
  userPrompt: string;
};

@Injectable()
export class SandboxForkPromptService {
  constructor(private readonly configService: ConfigService<AppConfig>) {}

  async buildPrompt(params: BuildPromptParams): Promise<string> {
    const agentConfig = this.configService.getOrThrow('AGENT', {
      infer: true,
    });
    const skillContent = await readFile(
      agentConfig.SANDBOX_FORK_SKILL_PATH,
      'utf8',
    );
    const targetDirectory = `${params.session.prototypeDir}/${params.targetKind}`;

    return [
      skillContent,
      '',
      '---',
      '',
      '# Backend Demo Runtime Contract',
      '',
      'Bạn đang chạy trong backend demo. Hãy tạo code prototype thật theo skill ở trên.',
      '',
      '## Session',
      `- sessionId: ${params.session.id}`,
      `- sessionSlug: ${params.session.routeSlug}`,
      `- routePath: ${params.session.routePath}/${params.targetKind}`,
      `- targetKind: ${params.targetKind}`,
      `- targetDirectory: ${targetDirectory}`,
      '',
      '## User prompt',
      params.userPrompt,
      '',
      '## Output bắt buộc khi chạy qua Codex agent',
      'Bạn phải tự đọc source code trong repo hiện tại, fork đúng theo skill ở trên, và ghi file trực tiếp vào targetDirectory.',
      '',
      'Quy tắc thực thi:',
      '- PHẢI parse URL/path trong user prompt nếu có, ví dụ /contacts.',
      '- PHẢI đọc page/module/component production liên quan trước khi viết prototype.',
      '- PHẢI clone JSX/style từ production, không tự chế UI.',
      '- PHẢI tạo file trong targetDirectory, tối thiểu page.tsx và _decisions.md.',
      '- Nếu cần mock data thì tạo _mock/data.ts.',
      '- KHÔNG sửa production components.',
      '- KHÔNG ghi file ngoài targetDirectory trừ khi bắt buộc đăng ký prototype trong _data.ts.',
      '- Sau khi ghi file, chạy tsc --noEmit hoặc command typecheck tương đương nếu repo hỗ trợ.',
      '- Final response ngắn gọn: liệt kê file đã tạo và trạng thái verify.',
    ].join('\n');
  }
}
