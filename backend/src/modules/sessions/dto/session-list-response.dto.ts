import { ApiProperty } from '@nestjs/swagger';

export class SessionListItemDto {
  @ApiProperty({
    description: 'ID của session trong database.',
    example: '7b7a90b0-8c50-4e46-8e61-33df0dbb4c58',
  })
  id!: string;

  @ApiProperty({
    description: 'Tiêu đề session do user nhập.',
    example: 'Meeting feature A',
  })
  title!: string;

  @ApiProperty({
    description: 'Slug dùng để tạo folder và route prototype.',
    example: 'meeting-feature-a',
  })
  routeSlug!: string;

  @ApiProperty({
    description: 'Route public để FE mở session prototype.',
    example: '/prototype/meeting-feature-a',
  })
  routePath!: string;

  @ApiProperty({
    description: 'Trạng thái hiện tại của session.',
    example: 'session_created',
  })
  status!: string;

  @ApiProperty({
    description: 'Thời điểm tạo session theo ISO string.',
    example: '2026-06-27T07:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Thời điểm cập nhật session theo ISO string.',
    example: '2026-06-27T07:05:00.000Z',
  })
  updatedAt!: string;
}

export class SessionListResponseDto {
  @ApiProperty({
    description: 'Danh sách session cho workspace demo.',
    type: SessionListItemDto,
    isArray: true,
  })
  items!: SessionListItemDto[];
}
