import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrototypeRuntimeModule } from '../prototype-runtime/prototype-runtime.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { SessionsController } from './controllers/sessions.controller';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { ChatSessionEntity } from './entities/chat-session.entity';
import { PrototypeItemEntity } from './entities/prototype-item.entity';
import { PromptsService } from './services/prompts.service';
import { SessionEventsService } from './services/session-events.service';
import { SessionsService } from './services/sessions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatSessionEntity,
      ChatMessageEntity,
      PrototypeItemEntity,
    ]),
    WorkspaceModule,
    PrototypeRuntimeModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService, PromptsService, SessionEventsService],
})
export class SessionsModule {}
