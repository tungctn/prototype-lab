import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SessionsModule } from '../sessions/sessions.module';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [AuthModule, WorkspaceModule, SessionsModule],
})
export class PrototypeModule {}
