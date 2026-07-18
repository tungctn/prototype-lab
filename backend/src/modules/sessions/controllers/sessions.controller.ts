import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Post,
  Query,
  Sse,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { CreateSessionDto } from '../dto/create-session.dto';
import { PromptAcceptedResponseDto } from '../dto/prompt-accepted-response.dto';
import { SessionDetailResponseDto } from '../dto/session-detail-response.dto';
import { SessionListResponseDto } from '../dto/session-list-response.dto';
import { SessionMessagesQueryDto } from '../dto/session-messages-query.dto';
import { SessionMessagesResponseDto } from '../dto/session-messages-response.dto';
import { SessionResponseDto } from '../dto/session-response.dto';
import { SubmitPromptDto } from '../dto/submit-prompt.dto';
import { PromptImageFile } from '../types/prompt-image-file';
import { PromptsService } from '../services/prompts.service';
import { SessionEventsService } from '../services/session-events.service';
import { SessionsService } from '../services/sessions.service';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly promptsService: PromptsService,
    private readonly eventsService: SessionEventsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List prototype sessions',
    description:
      'FE gọi để render Recent list và grid các prototype session hiện có của workspace demo.',
  })
  @ApiOkResponse({
    description: 'Danh sách session của workspace demo.',
    type: SessionListResponseDto,
  })
  listSessions(): Promise<SessionListResponseDto> {
    return this.sessionsService.listSessions();
  }

  @Post()
  @ApiOperation({
    summary: 'Create prototype session',
    description:
      'Tạo một phiên làm việc mới. Backend tạo chat_sessions record và folder {session_slug}; chưa tạo current/new cho tới khi user gửi prompt.',
  })
  @ApiBody({
    type: CreateSessionDto,
    examples: {
      meetingFeature: {
        summary: 'Meeting feature session',
        value: {
          title: 'Meeting feature A',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description:
      'Session đã được tạo. items rỗng vì chưa có current/new prototype.',
    type: SessionResponseDto,
  })
  createSession(@Body() dto: CreateSessionDto): Promise<SessionResponseDto> {
    return this.sessionsService.createSession(dto);
  }

  @Post(':sessionId/prompts')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  @ApiOperation({
    summary: 'Submit prompt for a session',
    description:
      'FE gửi prompt text, có thể kèm images[]. Backend lưu chat_messages(role=user), set session processing, chạy task local async và trả accepted nhanh. Tiến trình live đi qua SSE.',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'ID của session cần gửi prompt.',
    example: '7b7a90b0-8c50-4e46-8e61-33df0dbb4c58',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['content'],
      properties: {
        content: {
          type: 'string',
          example: 'Tôi cần cải thiện UI phần meeting',
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Prompt đã được nhận và task async đã bắt đầu.',
    type: PromptAcceptedResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy session.',
  })
  submitPrompt(
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitPromptDto,
    @UploadedFiles() images: PromptImageFile[] = [],
  ): Promise<PromptAcceptedResponseDto> {
    return this.promptsService.submitPrompt(sessionId, dto, images);
  }

  @Sse(':sessionId/events')
  @ApiOperation({
    summary: 'Subscribe to session live events',
    description:
      'FE mở EventSource để nhận session_status, ai_delta, current_ready, new_reloading, new_ready trong lúc backend xử lý prompt.',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'ID của session cần subscribe events.',
    example: '7b7a90b0-8c50-4e46-8e61-33df0dbb4c58',
  })
  getSessionEvents(
    @Param('sessionId') sessionId: string,
  ): Observable<MessageEvent> {
    return this.eventsService.getEvents(sessionId);
  }

  @Get(':sessionId/messages')
  @ApiOperation({
    summary: 'Get session chat messages',
    description:
      'Lấy lịch sử chat của session, sort theo created_at asc. Bản demo chỉ hỗ trợ limit đơn giản.',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'ID của session cần lấy messages.',
    example: '7b7a90b0-8c50-4e46-8e61-33df0dbb4c58',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Số message tối đa cần lấy.',
    example: 50,
  })
  @ApiOkResponse({
    description: 'Danh sách chat messages của session.',
    type: SessionMessagesResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy session.',
  })
  getSessionMessages(
    @Param('sessionId') sessionId: string,
    @Query() query: SessionMessagesQueryDto,
  ): Promise<SessionMessagesResponseDto> {
    return this.sessionsService.getSessionMessages(sessionId, query.limit);
  }

  @Get(':sessionId')
  @ApiOperation({
    summary: 'Get session detail',
    description:
      'Lấy lại trạng thái session để FE render header, chat panel và preview current/new.',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'ID của session cần lấy.',
    example: '7b7a90b0-8c50-4e46-8e61-33df0dbb4c58',
  })
  @ApiOkResponse({
    description: 'Session detail kèm danh sách prototype items.',
    type: SessionDetailResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy session.',
  })
  getSessionDetail(
    @Param('sessionId') sessionId: string,
  ): Promise<SessionDetailResponseDto> {
    return this.sessionsService.getSessionDetail(sessionId);
  }
}
