import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkspaceResponseDto } from '../dto/workspace-response.dto';
import { WorkspaceService } from '../services/workspace.service';

@ApiTags('Workspace')
@Controller()
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get('workspace')
  @ApiOperation({
    summary: 'Get demo workspace',
    description:
      'FE gọi khi mở màn hình demo để biết backend đang trỏ tới repo/local prototype root nào. Nếu workspace chưa tồn tại, backend seed một record demo từ env/config.',
  })
  @ApiOkResponse({
    description: 'Workspace demo đã sẵn sàng.',
    type: WorkspaceResponseDto,
  })
  getWorkspace(): Promise<WorkspaceResponseDto> {
    return this.workspaceService.getOrCreateDemoWorkspace();
  }
}
