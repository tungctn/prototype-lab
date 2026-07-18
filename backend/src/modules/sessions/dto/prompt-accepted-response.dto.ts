import { ApiProperty } from '@nestjs/swagger';

export class PromptAcceptedResponseDto {
  @ApiProperty({
    description: 'Backend đã nhận prompt và bắt đầu xử lý async.',
    example: true,
  })
  accepted!: true;

  @ApiProperty({
    description: 'ID của session đang xử lý prompt.',
    example: '7b7a90b0-8c50-4e46-8e61-33df0dbb4c58',
  })
  sessionId!: string;

  @ApiProperty({
    description: 'Trạng thái trả về ngay sau khi nhận prompt.',
    example: 'processing',
  })
  status!: 'processing';
}
