import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfig } from '../../../config/app.config';
import { WorkspaceResponseDto } from '../dto/workspace-response.dto';
import { WorkspaceEntity } from '../entities/workspace.entity';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  async getOrCreateDemoWorkspace(): Promise<WorkspaceResponseDto> {
    const workspace = await this.getOrCreateDemoWorkspaceEntity();

    return {
      id: workspace.id,
      name: workspace.name,
      repoName: workspace.repoName,
      prototypeRoot: workspace.prototypeRoot,
      status: 'ready',
    };
  }

  async getOrCreateDemoWorkspaceEntity(): Promise<WorkspaceEntity> {
    const demoConfig = this.configService.getOrThrow('DEMO', { infer: true });

    let workspace = await this.workspaceRepository.findOne({
      where: {
        repoName: demoConfig.REPO_NAME,
        prototypeRoot: demoConfig.PROTOTYPE_ROOT,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    if (!workspace) {
      workspace = this.workspaceRepository.create({
        name: demoConfig.WORKSPACE_NAME,
        repoName: demoConfig.REPO_NAME,
        repoUrl: demoConfig.REPO_URL || null,
        prototypeRoot: demoConfig.PROTOTYPE_ROOT,
      });
      workspace = await this.workspaceRepository.save(workspace);
    }

    return workspace;
  }
}
