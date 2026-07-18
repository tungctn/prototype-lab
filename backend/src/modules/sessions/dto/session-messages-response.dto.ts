import { ApiProperty } from '@nestjs/swagger';
import { ChatMessageAttachment } from '../types/chat-message-attachment';

export class ChatMessageResponseDto {
  @ApiProperty({
    description: 'ID của chat message.',
    example: '7b7a90b0-8c50-4e46-8e61-33df0dbb4c58',
  })
  id!: string;

  @ApiProperty({
    description: 'Vai trò của message.',
    example: 'user',
    enum: ['user', 'assistant', 'system'],
  })
  role!: string;

  @ApiProperty({
    description: 'Nội dung message.',
    example: 'Tôi muốn cải thiện UI này',
  })
  content!: string;

  @ApiProperty({
    description: 'File đính kèm của message, hiện chỉ hỗ trợ image.',
    example: [
      {
        type: 'image',
        filename: 'meeting.png',
        mimeType: 'image/png',
        path: '/prototype-root/meeting-feature-a/_uploads/meeting.png',
        size: 1024,
      },
    ],
    isArray: true,
  })
  attachments!: ChatMessageAttachment[];

  @ApiProperty({
    description: 'Thời điểm tạo message theo ISO string.',
    example: '2026-06-27T07:00:00.000Z',
  })
  createdAt!: string;
}

export class SessionMessagesResponseDto {
  @ApiProperty({
    description: 'Danh sách chat message của session.',
    type: [ChatMessageResponseDto],
  })
  items!: ChatMessageResponseDto[];
}
