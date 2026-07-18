import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { WorkspaceEntity } from '../entities/workspace.entity';
import { WorkspaceService } from './workspace.service';

type WorkspaceRepositoryMock = Pick<
  jest.Mocked<Repository<WorkspaceEntity>>,
  'create' | 'findOne' | 'save'
>;

describe('WorkspaceService', () => {
  const demoConfig = {
    WORKSPACE_NAME: 'SNDQ Demo Workspace',
    REPO_NAME: 'sndq-fe',
    REPO_URL: null,
    PROTOTYPE_ROOT:
      '/Users/mac/Workspace/sndq/sndq/sndq-fe/src/app/(prototype)/prototype',
  };

  let workspaceRepository: WorkspaceRepositoryMock;
  let configService: jest.Mocked<Pick<ConfigService, 'getOrThrow'>>;
  let service: WorkspaceService;

  beforeEach(() => {
    workspaceRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    configService = {
      getOrThrow: jest.fn().mockReturnValue(demoConfig),
    };
    service = new WorkspaceService(
      workspaceRepository as Repository<WorkspaceEntity>,
      configService as ConfigService,
    );
  });

  it('returns existing demo workspace without creating a new row', async () => {
    workspaceRepository.findOne.mockResolvedValue({
      id: 'workspace-id',
      name: demoConfig.WORKSPACE_NAME,
      repoName: demoConfig.REPO_NAME,
      repoUrl: null,
      prototypeRoot: demoConfig.PROTOTYPE_ROOT,
      createdAt: new Date('2026-06-27T00:00:00.000Z'),
    } as WorkspaceEntity);

    await expect(service.getOrCreateDemoWorkspace()).resolves.toEqual({
      id: 'workspace-id',
      name: demoConfig.WORKSPACE_NAME,
      repoName: demoConfig.REPO_NAME,
      prototypeRoot: demoConfig.PROTOTYPE_ROOT,
      status: 'ready',
    });

    expect(configService.getOrThrow).toHaveBeenCalledWith('DEMO', {
      infer: true,
    });
    expect(workspaceRepository.findOne).toHaveBeenCalledWith({
      where: {
        repoName: demoConfig.REPO_NAME,
        prototypeRoot: demoConfig.PROTOTYPE_ROOT,
      },
      order: {
        createdAt: 'ASC',
      },
    });
    expect(workspaceRepository.create).not.toHaveBeenCalled();
    expect(workspaceRepository.save).not.toHaveBeenCalled();
  });

  it('seeds demo workspace when it does not exist', async () => {
    const unsavedWorkspace = {
      name: demoConfig.WORKSPACE_NAME,
      repoName: demoConfig.REPO_NAME,
      repoUrl: null,
      prototypeRoot: demoConfig.PROTOTYPE_ROOT,
    } as WorkspaceEntity;
    const savedWorkspace = {
      ...unsavedWorkspace,
      id: 'new-workspace-id',
      createdAt: new Date('2026-06-27T00:00:00.000Z'),
    } as WorkspaceEntity;

    workspaceRepository.findOne.mockResolvedValue(null);
    workspaceRepository.create.mockReturnValue(unsavedWorkspace);
    workspaceRepository.save.mockResolvedValue(savedWorkspace);

    await expect(service.getOrCreateDemoWorkspace()).resolves.toEqual({
      id: 'new-workspace-id',
      name: demoConfig.WORKSPACE_NAME,
      repoName: demoConfig.REPO_NAME,
      prototypeRoot: demoConfig.PROTOTYPE_ROOT,
      status: 'ready',
    });

    expect(workspaceRepository.create).toHaveBeenCalledWith({
      name: demoConfig.WORKSPACE_NAME,
      repoName: demoConfig.REPO_NAME,
      repoUrl: null,
      prototypeRoot: demoConfig.PROTOTYPE_ROOT,
    });
    expect(workspaceRepository.save).toHaveBeenCalledWith(unsavedWorkspace);
  });
});
