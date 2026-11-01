import { TestBed } from '@angular/core/testing';
import {
  docData,
  Firestore,
} from '@angular/fire/firestore';
import { createSpyObj } from 'jest-createspyobj';
import { Subject } from 'rxjs';

import {
  createVersionId,
  storageObjectPath,
} from '@portfolio-v2/state/dataModels';
import { GetDataService } from '../get-data/get-data.service';
import { DocumentCatalogReader } from './document-catalog.reader';

jest.mock('@angular/fire/firestore', () => {
  const actual = jest.requireActual('@angular/fire/firestore');
  return {
    ...actual,
    doc: jest.fn((_firestore: unknown, path: string) => ({ path })),
    docData: jest.fn(),
  };
});

const SEEDED_ID = createVersionId(1730000000000, 1);
const SEEDED_PATH = storageObjectPath('cover-letter', SEEDED_ID);

/**
 * @param path object path
 * @returns one readable cover-letter row
 */
function coverLetterBody(path: string): unknown {
  return {
    versions: [{
      id: SEEDED_ID,
      uploadedAt: '2026-01-01T00:00:00.000Z',
      storagePath: path,
      downloadUrl: `storage://${path}`,
      pendingDeletes: [],
    }],
  };
}

describe('DocumentCatalogReader', () => {
  let resumeSnapshots: Subject<unknown>;
  let coverLetterSnapshots: Subject<unknown>;
  let getData: jest.Mocked<GetDataService>;
  let reader: DocumentCatalogReader;

  beforeEach(() => {
    resumeSnapshots = new Subject();
    coverLetterSnapshots = new Subject();
    jest.mocked(docData).mockClear();
    jest.mocked(docData).mockImplementation((reference) => (
      String(reference.path).endsWith('cover-letter') ? coverLetterSnapshots : resumeSnapshots
    ));
    getData = createSpyObj(GetDataService);
    TestBed.configureTestingModule({
      providers: [
        DocumentCatalogReader,
        { provide: Firestore, useValue: {} },
        { provide: GetDataService, useValue: getData },
      ],
    });
    reader = TestBed.inject(DocumentCatalogReader);
  });

  it('should leave the signal loading until the first snapshot', () => {
    expect(reader.view('resume')().status).toBe('loading');
    expect(docData).toHaveBeenCalledTimes(2);
  });

  it('should read bytes for the current cover letter', async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    getData.getFileBytes.mockResolvedValue(bytes);
    const pending = reader.coverLetterTemplate();
    coverLetterSnapshots.next(coverLetterBody(SEEDED_PATH));

    await expect(pending).resolves.toBe(bytes);
    expect(getData.getFileBytes).toHaveBeenCalledWith(SEEDED_PATH);
    expect(reader.view('cover-letter')().status).toBe('ready');
  });

  it('should fetch the bundled docx when the catalog is empty', async () => {
    const bytes = new Uint8Array([4]).buffer;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(bytes),
    });
    global.fetch = fetchMock;
    const pending = reader.coverLetterTemplate();
    coverLetterSnapshots.next(undefined);

    await expect(pending).resolves.toBe(bytes);
    expect(getData.getFileBytes).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith('assets/CoverLetter/PubuduCoverLetter.docx');
  });

  it('should stay unreadable when the body breaks an invariant', () => {
    resumeSnapshots.next({ versions: 'bad' });

    expect(reader.view('resume')()).toEqual({ status: 'unreadable' });
  });
});
