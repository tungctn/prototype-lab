import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { PromptImageFile } from '../../sessions/types/prompt-image-file';
import { PrototypeFilesystemService } from './prototype-filesystem.service';

jest.mock('node:fs/promises', () => ({
  cp: jest.fn(),
  mkdir: jest.fn(),
  readFile: jest.fn(),
  rm: jest.fn(),
  writeFile: jest.fn(),
}));

describe('PrototypeFilesystemService', () => {
  const cpMock = jest.mocked(cp);
  const mkdirMock = jest.mocked(mkdir);
  const readFileMock = jest.mocked(readFile);
  const rmMock = jest.mocked(rm);
  const writeFileMock = jest.mocked(writeFile);

  beforeEach(() => {
    cpMock.mockReset();
    mkdirMock.mockReset();
    readFileMock.mockReset();
    rmMock.mockReset();
    writeFileMock.mockReset();
  });

  it('creates only the session folder recursively', async () => {
    const service = new PrototypeFilesystemService();

    await expect(
      service.ensureSessionDirectory('/prototype-root', 'meeting-feature-a'),
    ).resolves.toBe('/prototype-root/meeting-feature-a');

    expect(mkdirMock).toHaveBeenCalledTimes(1);
    expect(mkdirMock).toHaveBeenCalledWith(
      '/prototype-root/meeting-feature-a',
      {
        recursive: true,
      },
    );
  });

  it('creates current prototype folder and mock content', async () => {
    const service = new PrototypeFilesystemService();

    await expect(
      service.createCurrentPrototype(
        '/prototype-root/meeting-feature-a',
        'hello',
      ),
    ).resolves.toBe('/prototype-root/meeting-feature-a/current');

    expect(mkdirMock).toHaveBeenCalledWith(
      '/prototype-root/meeting-feature-a/current',
      {
        recursive: true,
      },
    );
    expect(writeFileMock).toHaveBeenCalledWith(
      '/prototype-root/meeting-feature-a/current/README.md',
      expect.stringContaining('hello'),
      'utf8',
    );
  });

  it('copies current prototype to new after removing old new folder', async () => {
    const service = new PrototypeFilesystemService();

    await expect(
      service.copyCurrentToNew('/prototype-root/meeting-feature-a'),
    ).resolves.toBe('/prototype-root/meeting-feature-a/new');

    expect(rmMock).toHaveBeenCalledWith(
      '/prototype-root/meeting-feature-a/new',
      {
        recursive: true,
        force: true,
      },
    );
    expect(cpMock).toHaveBeenCalledWith(
      '/prototype-root/meeting-feature-a/current',
      '/prototype-root/meeting-feature-a/new',
      {
        recursive: true,
      },
    );
  });

  it('writes prompt patch into new prototype', async () => {
    const service = new PrototypeFilesystemService();

    await expect(
      service.writeNewPromptPatch(
        '/prototype-root/meeting-feature-a',
        'update UI',
      ),
    ).resolves.toBe('/prototype-root/meeting-feature-a/new/_prompt.md');

    expect(writeFileMock).toHaveBeenCalledWith(
      '/prototype-root/meeting-feature-a/new/_prompt.md',
      expect.stringContaining('update UI'),
      'utf8',
    );
  });

  it('writes generated files inside target folder', async () => {
    const service = new PrototypeFilesystemService();

    await service.writeGeneratedFiles('/prototype-root/session/current', [
      {
        path: '_mock/data.ts',
        content: 'export const data = {};',
      },
      {
        path: 'page.tsx',
        content: 'export default function Page() { return null; }',
      },
    ]);

    expect(mkdirMock).toHaveBeenCalledWith(
      '/prototype-root/session/current/_mock',
      {
        recursive: true,
      },
    );
    expect(writeFileMock).toHaveBeenCalledWith(
      '/prototype-root/session/current/_mock/data.ts',
      'export const data = {};',
      'utf8',
    );
    expect(writeFileMock).toHaveBeenCalledWith(
      '/prototype-root/session/current/page.tsx',
      'export default function Page() { return null; }',
      'utf8',
    );
  });

  it('rejects generated files that escape target folder', async () => {
    const service = new PrototypeFilesystemService();

    await expect(
      service.writeGeneratedFiles('/prototype-root/session/current', [
        {
          path: '../page.tsx',
          content: 'bad',
        },
      ]),
    ).rejects.toThrow('Generated file path escapes target folder');
  });

  it('saves prompt images into session uploads folder', async () => {
    const service = new PrototypeFilesystemService();
    const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1782549000000);

    await expect(
      service.savePromptImages('/prototype-root/session', [
        {
          originalname: 'Screen Shot.png',
          mimetype: 'image/png',
          buffer: Buffer.from('image'),
          size: 5,
        } as PromptImageFile,
      ]),
    ).resolves.toEqual([
      {
        type: 'image',
        filename: '1782549000000-0-screen-shot.png',
        mimeType: 'image/png',
        path: '/prototype-root/session/_uploads/1782549000000-0-screen-shot.png',
        size: 5,
      },
    ]);

    expect(mkdirMock).toHaveBeenCalledWith('/prototype-root/session/_uploads', {
      recursive: true,
    });
    expect(writeFileMock).toHaveBeenCalledWith(
      '/prototype-root/session/_uploads/1782549000000-0-screen-shot.png',
      Buffer.from('image'),
    );
    dateNowSpy.mockRestore();
  });

  it('rejects non-image prompt uploads', async () => {
    const service = new PrototypeFilesystemService();

    await expect(
      service.savePromptImages('/prototype-root/session', [
        {
          originalname: 'note.txt',
          mimetype: 'text/plain',
          buffer: Buffer.from('text'),
          size: 4,
        } as PromptImageFile,
      ]),
    ).rejects.toThrow('Only image uploads are supported');
  });

  it('reads attachment as data URL', async () => {
    const service = new PrototypeFilesystemService();
    readFileMock.mockResolvedValue(Buffer.from('image'));

    await expect(
      service.readAttachmentAsDataUrl({
        type: 'image',
        filename: 'screen.png',
        mimeType: 'image/png',
        path: '/uploads/screen.png',
        size: 5,
      }),
    ).resolves.toBe('data:image/png;base64,aW1hZ2U=');
  });
});
