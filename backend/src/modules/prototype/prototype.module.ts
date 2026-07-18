import { Module } from '@nestjs/common';
import { SessionsModule } from '../sessions/sessions.module';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [WorkspaceModule, SessionsModule],
})
export class PrototypeModule {}
