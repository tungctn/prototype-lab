import { Module } from '@nestjs/common';
import { WorkspaceModule } from '../workspace/workspace.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';

@Module({
  imports: [WorkspaceModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
