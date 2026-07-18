import { WorkspaceService } from '../services/workspace.service';
import { WorkspaceController } from './workspace.controller';

describe('WorkspaceController', () => {
  it('returns demo workspace from service', async () => {
    const workspace = {
      id: 'workspace-id',
      name: 'SNDQ Demo Workspace',
      repoName: 'sndq-fe',
      prototypeRoot:
        '/Users/mac/Workspace/sndq/sndq/sndq-fe/src/app/(prototype)/prototype',
      status: 'ready' as const,
    };
    const workspaceService = {
      getOrCreateDemoWorkspace: jest.fn().mockResolvedValue(workspace),
    } as Pick<WorkspaceService, 'getOrCreateDemoWorkspace'>;
    const controller = new WorkspaceController(
      workspaceService as WorkspaceService,
    );

    await expect(controller.getWorkspace()).resolves.toEqual(workspace);
    expect(workspaceService.getOrCreateDemoWorkspace).toHaveBeenCalledTimes(1);
  });
});
