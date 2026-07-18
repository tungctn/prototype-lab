import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceResponseDto {
  @ApiProperty({
    description: 'ID của workspace demo trong database.',
    example: '7b7a90b0-8c50-4e46-8e61-33df0dbb4c58',
  })
  id!: string;

  @ApiProperty({
    description: 'Tên workspace hiển thị trên FE.',
    example: 'SNDQ Demo Workspace',
  })
  name!: string;

  @ApiProperty({
    description: 'Tên repo/local app đang demo.',
    example: 'sndq-fe',
  })
  repoName!: string;

  @ApiProperty({
    description: 'Folder chứa các prototype route trong local app.',
    example:
      '/Users/mac/Workspace/sndq/sndq/sndq-fe/src/app/(prototype)/prototype',
  })
  prototypeRoot!: string;

  @ApiProperty({
    description: 'Trạng thái workspace demo.',
    example: 'ready',
  })
  status!: 'ready';
}
