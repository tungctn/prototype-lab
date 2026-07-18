import { ApiProperty } from '@nestjs/swagger';

export class PrototypeItemResponseDto {
  @ApiProperty({
    description: 'Loại prototype item trong session.',
    example: 'current',
    enum: ['current', 'new'],
  })
  kind!: 'current' | 'new';

  @ApiProperty({
    description: 'URL FE dùng để mở preview item.',
    example: '/prototype/meeting-feature-a/current',
  })
  url!: string;
}

export class SessionDetailResponseDto {
  @ApiProperty({
    description: 'ID của session trong database.',
    example: '7b7a90b0-8c50-4e46-8e61-33df0dbb4c58',
  })
  id!: string;

  @ApiProperty({
    description: 'Tiêu đề session.',
    example: 'Meeting feature A',
  })
  title!: string;

  @ApiProperty({
    description: 'Trạng thái hiện tại của session.',
    example: 'new_ready',
  })
  status!: string;

  @ApiProperty({
    description: 'Route public của session.',
    example: '/prototype/meeting-feature-a',
  })
  routePath!: string;

  @ApiProperty({
    description: 'Danh sách preview current/new đã có trong session.',
    type: [PrototypeItemResponseDto],
    example: [
      {
        kind: 'current',
        url: '/prototype/meeting-feature-a/current',
      },
      {
        kind: 'new',
        url: '/prototype/meeting-feature-a/new',
      },
    ],
  })
  items!: PrototypeItemResponseDto[];
}
