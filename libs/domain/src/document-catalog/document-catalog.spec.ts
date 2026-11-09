import {
  acceptUpload,
  applyCatalogCommand,
  canDelete,
  catalogDocPath,
  coverLetterNavTarget,
  createVersionId,
  DOCUMENT_KIND_SPECS,
  documentWriteMessage,
  DocumentWriteError,
  isCurrent,
  mirrorDocumentPath,
  parseCatalog,
  parseKind,
  resumeHref,
  resumeNavTarget,
  storageObjectPath,
  type CatalogCommand,
  type CatalogView,
  type CommandResult,
  type DocumentKind,
  type UploadAttempt,
  type VersionId,
} from './document-catalog';

const SEEDED_AT = '2026-01-01T00:00:00.000Z';

/**
 * @param id version id
 * @param downloadUrl url stored on the row
 * @returns an upload command payload
 */
function attempt(id: VersionId, downloadUrl = `https://files.example/${id}`): UploadAttempt {
  return {
    id,
    uploadedAt: SEEDED_AT,
    downloadUrl,
  };
}

/**
 * @param kind resume or cover letter
 * @param count how many new ids to prepend, from entropy 1
 * @returns the last successful insert
 */
function uploadTimes(kind: DocumentKind, count: number): CommandResult & { ok: true } {
  let current: unknown;
  let last: CommandResult | null = null;
  for (let entropy = 1; entropy <= count; entropy += 1) {
    last = applyCatalogCommand(kind, current, {
      type: 'upload',
      attempt: attempt(createVersionId(1730000000000, entropy)),
    });
    if (!last.ok || last.wire === null) {
      throw new Error(`upload ${entropy} did not insert`);
    }
    current = last.wire;
  }
  if (last === null || !last.ok) {
    throw new Error('expected a catalog');
  }
  return last;
}

/**
 * @param entropy six-digit suffix
 * @returns the resume object path for the seed clock
 */
function resumePath(entropy: number): string {
  return `portfolio/documents/resume/resume-1730000000000-${entropy.toString().padStart(6, '0')}.pdf`;
}

describe('document catalog', () => {
  describe('acceptUpload', () => {
    describe('when the mime type matches', () => {
      it('should accept the file', () => {
        const file = new File(['%PDF'], 'resume.pdf', { type: 'application/pdf' });

        expect(acceptUpload('resume', file)).toEqual({ ok: true });
      });
    });

    describe('when the mime type is wrong', () => {
      it('should reject the file', () => {
        const file = new File(['%PDF'], 'notes.pdf', { type: 'image/png' });

        expect(acceptUpload('resume', file)).toEqual({ ok: false, reason: 'rejected-type' });
      });
    });

    describe('when the type is empty and the name ends with .docx', () => {
      it('should accept a cover letter', () => {
        const file = new File(['PK'], 'Letter.DOCX', { type: '' });

        expect(acceptUpload('cover-letter', file)).toEqual({ ok: true });
      });
    });

    describe('when the type is application/octet-stream and the extension matches', () => {
      it('should accept the file', () => {
        const file = new File(['%PDF'], 'Pubudu_Resumes.PDF', { type: 'application/octet-stream' });

        expect(acceptUpload('resume', file)).toEqual({ ok: true });
      });
    });

    describe('when the type is wrong and the extension matches', () => {
      it('should reject the file', () => {
        const file = new File(['PK'], 'letter.docx', { type: 'text/plain' });

        expect(acceptUpload('cover-letter', file)).toEqual({ ok: false, reason: 'rejected-type' });
      });
    });

    describe('when the file is empty', () => {
      it('should reject the file', () => {
        const file = new File([], 'resume.pdf', { type: 'application/pdf' });

        expect(acceptUpload('resume', file)).toEqual({ ok: false, reason: 'rejected-type' });
      });
    });
  });

  describe('applyCatalogCommand', () => {
    describe('when a sixth version is uploaded', () => {
      it('should keep five versions and name the oldest path', () => {
        const stored = uploadTimes('resume', 6);
        const ids = stored.catalog.versions.map((version) => version.id);

        expect(stored.catalog.versions).toHaveLength(5);
        expect(ids).not.toContain(createVersionId(1730000000000, 1));
        expect(ids[0]).toBe(createVersionId(1730000000000, 6));
        expect(stored.deletePaths).toContain(resumePath(1));
        expect(stored.catalog.versions[0].pendingDeletes).toContain(resumePath(1));
      });
    });

    describe('when the same id is uploaded again', () => {
      it('should not add a row and should return that row pending deletes', () => {
        const stored = uploadTimes('resume', 6);
        const current = stored.catalog.versions[0];
        const again = applyCatalogCommand('resume', stored.wire, {
          type: 'upload',
          attempt: attempt(current.id, 'https://files.example/replacement'),
        });

        expect(again.ok).toBe(true);
        if (!again.ok) {
          return;
        }
        expect(again.wire).toBeNull();
        expect(again.catalog.versions).toHaveLength(5);
        expect(again.catalog.versions.map((version) => version.id)).toEqual(
          stored.catalog.versions.map((version) => version.id),
        );
        expect(again.catalog.versions[0].downloadUrl).toBe(current.downloadUrl);
        expect(again.catalog.versions[0].uploadedAt).toBe(current.uploadedAt);
        expect(again.deletePaths).toEqual(current.pendingDeletes);
      });
    });

    describe('when the current version is removed and another remains', () => {
      it('should promote the next row and delete the removed file', () => {
        const stored = uploadTimes('cover-letter', 2);
        const current = stored.catalog.versions[0];
        const previous = stored.catalog.versions[1];
        const result = applyCatalogCommand('cover-letter', stored.wire, {
          type: 'remove',
          version: current,
        });

        expect(result.ok).toBe(true);
        if (!result.ok) {
          return;
        }
        expect(result.catalog.versions.map((version) => version.id)).toEqual([previous.id]);
        expect(result.deletePaths).toEqual([current.storagePath]);
        expect(result.wire).not.toBeNull();
      });
    });

    describe('when the only version is removed', () => {
      it('should protect it', () => {
        const stored = uploadTimes('resume', 1);
        const result = applyCatalogCommand('resume', stored.wire, {
          type: 'remove',
          version: stored.catalog.versions[0],
        });

        expect(result).toEqual({ ok: false, reason: 'protected' });
        expect(canDelete(stored.catalog, stored.catalog.versions[0].id)).toBe(false);
      });
    });

    describe('when the removed id is not in the catalog', () => {
      it('should keep the catalog and name paths that are no longer live', () => {
        const stored = uploadTimes('resume', 2);
        const missingId = createVersionId(1730000000000, 9);
        const missing = {
          ...stored.catalog.versions[0],
          id: missingId,
          storagePath: storageObjectPath('resume', missingId),
          pendingDeletes: [resumePath(8)],
        };
        const result = applyCatalogCommand('resume', stored.wire, {
          type: 'remove',
          version: missing,
        });

        expect(result.ok).toBe(true);
        if (!result.ok) {
          return;
        }
        expect(result.wire).toBeNull();
        expect(result.catalog.versions.map((version) => version.id)).toEqual(
          stored.catalog.versions.map((version) => version.id),
        );
        expect(result.deletePaths).toEqual([missing.storagePath, resumePath(8)]);
        expect(canDelete(stored.catalog, missingId)).toBe(false);
      });
    });

    describe('when an older version is removed', () => {
      it('should drop that row and keep the current one', () => {
        const stored = uploadTimes('resume', 2);
        const older = stored.catalog.versions[1];
        const result = applyCatalogCommand('resume', stored.wire, {
          type: 'remove',
          version: older,
        });

        expect(result.ok).toBe(true);
        if (!result.ok) {
          return;
        }
        expect(result.catalog.versions.map((version) => version.id)).toEqual([
          stored.catalog.versions[0].id,
        ]);
        expect(result.deletePaths).toEqual([older.storagePath]);
        expect(result.wire).not.toBeNull();
      });
    });

    describe('when the body cannot be read', () => {
      it('should not build a replacement catalog', () => {
        const command: CatalogCommand = {
          type: 'upload',
          attempt: attempt(createVersionId(1730000000000, 1)),
        };
        const id = createVersionId(1730000000000, 9);
        const tooLong = [1, 2, 3, 4, 5, 6].map((entropy) => {
          const versionId = createVersionId(1730000000000, entropy);
          return {
            id: versionId,
            uploadedAt: SEEDED_AT,
            storagePath: storageObjectPath('resume', versionId),
            downloadUrl: 'https://files.example/file',
            pendingDeletes: [],
          };
        });
        const bodies: unknown[] = [
          { versions: 'nope' },
          null,
          {
            versions: [{
              id,
              uploadedAt: SEEDED_AT,
              storagePath: `portfolio/documents/resume/${id}.pdf`,
              downloadUrl: 'https://files.example/file',
              pendingDeletes: [],
            }],
          },
          { versions: tooLong },
        ];

        bodies.forEach((body) => {
          expect(parseCatalog('resume', body)).toEqual({ ok: false, reason: 'unreadable' });
          expect(applyCatalogCommand('resume', body, command)).toEqual({
            ok: false,
            reason: 'unreadable',
          });
        });
      });
    });
  });

  describe('parseCatalog', () => {
    describe('when the document is missing', () => {
      it('should be an empty catalog', () => {
        const parsed = parseCatalog('resume', undefined);

        expect(parsed.ok).toBe(true);
        if (!parsed.ok) {
          return;
        }
        expect(parsed.catalog.versions).toEqual([]);
      });
    });

    describe('when uploadedAt is out of order', () => {
      it('should keep index 0 as current', () => {
        const older = createVersionId(1730000000000, 2);
        const newer = createVersionId(1730000000000, 1);
        const parsed = parseCatalog('resume', {
          versions: [
            {
              id: older,
              uploadedAt: '2020-01-01T00:00:00.000Z',
              storagePath: storageObjectPath('resume', older),
              downloadUrl: 'https://files.example/older',
              pendingDeletes: [],
            },
            {
              id: newer,
              uploadedAt: '2026-06-01T00:00:00.000Z',
              storagePath: storageObjectPath('resume', newer),
              downloadUrl: 'https://files.example/newer',
              pendingDeletes: [],
            },
          ],
        });

        expect(parsed.ok).toBe(true);
        if (!parsed.ok) {
          return;
        }
        expect(isCurrent(parsed.catalog, older)).toBe(true);
        expect(canDelete(parsed.catalog, older)).toBe(true);
        expect(canDelete(parsed.catalog, newer)).toBe(true);
        expect(parsed.catalog.versions[0].downloadUrl).toBe('https://files.example/older');
      });
    });
  });

  describe('storageObjectPath', () => {
    const id = createVersionId(1730000000000, 1);

    it('should put resume- and .pdf on the final segment', () => {
      const path = storageObjectPath('resume', id);
      const segment = path.slice(path.lastIndexOf('/') + 1);

      expect(id).toBe('1730000000000-000001');
      expect(segment.startsWith('resume-')).toBe(true);
      expect(segment.endsWith('.pdf')).toBe(true);
      expect(path).toBe(resumePath(1));
    });

    it('should keep resume and cv out of the cover-letter file name', () => {
      const path = storageObjectPath('cover-letter', id);
      const segment = path.slice(path.lastIndexOf('/') + 1);

      expect(segment).toBe('1730000000000-000001.docx');
      expect(segment.includes('resume')).toBe(false);
      expect(segment.toLowerCase().includes('cv')).toBe(false);
    });
  });

  describe('resumeHref', () => {
    it('should be null while loading', () => {
      const view: CatalogView = { status: 'loading' };

      expect(resumeHref(view)).toBeNull();
    });

    it('should use the bundled pdf when the catalog is empty or unreadable', () => {
      const empty = parseCatalog('resume', undefined);
      if (!empty.ok) {
        throw new Error('missing document should be empty');
      }

      expect(resumeHref({ status: 'ready', catalog: empty.catalog })).toBe(
        DOCUMENT_KIND_SPECS.resume.bundledUrl,
      );
      expect(resumeHref({ status: 'unreadable' })).toBe(DOCUMENT_KIND_SPECS.resume.bundledUrl);
    });

    it('should use the current download url when a version is ready', () => {
      const stored = uploadTimes('resume', 1);

      expect(resumeHref({ status: 'ready', catalog: stored.catalog })).toBe(
        stored.catalog.versions[0].downloadUrl,
      );
    });
  });

  describe('navigation', () => {
    const loading: CatalogView = { status: 'loading' };

    it('should send a signed-in admin to the admin pages', () => {
      expect(resumeNavTarget(true, false, loading)).toEqual({
        kind: 'admin',
        path: '/admin/resume',
      });
      expect(coverLetterNavTarget(true, false)).toEqual({
        kind: 'admin',
        path: '/admin/coverletter',
      });
    });

    it('should keep visitor destinations in preview', () => {
      expect(resumeNavTarget(true, true, loading)).toEqual({ kind: 'file', href: null });
      expect(coverLetterNavTarget(true, true)).toEqual({
        kind: 'page',
        path: '/content/coverletter',
      });
    });

    it('should mirror resume admin to home and cover letter to the generator', () => {
      expect(mirrorDocumentPath('/admin/resume')).toBe('/home');
      expect(mirrorDocumentPath('/admin/coverletter')).toBe('/content/coverletter');
      expect(mirrorDocumentPath('/content/coverletter')).toBe('/admin/coverletter');
      expect(mirrorDocumentPath('/home')).toBeNull();
    });

    it('should reject an unknown kind', () => {
      expect(parseKind('coverletter')).toBeNull();
      expect(parseKind(null)).toBeNull();
      expect(parseKind('resume')).toBe('resume');
      expect(parseKind('cover-letter')).toBe('cover-letter');
      expect(catalogDocPath('cover-letter')).toBe('document-versions/cover-letter');
    });
  });

  describe('documentWriteMessage', () => {
    it('should name the file kind on a rejected type', () => {
      expect(documentWriteMessage(new DocumentWriteError('rejected-type', 'resume'))).toBe(
        'Choose a PDF file.',
      );
      expect(documentWriteMessage(new DocumentWriteError('rejected-type', 'cover-letter'))).toBe(
        'Choose a Word .docx file.',
      );
      expect(documentWriteMessage(new DocumentWriteError('protected', 'resume'))).toBe(
        'The only version cannot be deleted.',
      );
      expect(documentWriteMessage(new DocumentWriteError('rejected-type', null))).toBe(
        'Choose a PDF or a Word .docx file.',
      );
      expect(documentWriteMessage(new DocumentWriteError('unauthenticated'))).toBe(
        'Sign in before changing documents.',
      );
      expect(documentWriteMessage(new DocumentWriteError('upload-failed'))).toBe(
        'The file did not upload. Nothing was saved.',
      );
      expect(documentWriteMessage(new DocumentWriteError('commit-failed'))).toBe(
        'The version list could not be saved.',
      );
      expect(documentWriteMessage(new DocumentWriteError('cleanup-failed'))).toBe(
        'The version list is saved, but an older file is still in storage.',
      );
      expect(documentWriteMessage(new Error('offline'))).toBe(
        'The version list could not be saved.',
      );
      const unexpected = new DocumentWriteError('protected');
      Object.assign(unexpected, { reason: 'other' });
      expect(() => documentWriteMessage(unexpected)).toThrow(
        'Unexpected document write failure: other',
      );
    });
  });

  describe('createVersionId', () => {
    it('should brand a zero clock and the largest entropy', () => {
      expect(createVersionId(0, 0)).toBe('0-000000');
      expect(createVersionId(5, 999999)).toBe('5-999999');
    });

    it('should reject a clock or entropy outside the stored pattern', () => {
      expect(() => createVersionId(-1, 1)).toThrow(RangeError);
      expect(() => createVersionId(1.5, 1)).toThrow(RangeError);
      expect(() => createVersionId(1, -1)).toThrow(RangeError);
      expect(() => createVersionId(1, 1.5)).toThrow(RangeError);
      expect(() => createVersionId(1, 1000000)).toThrow(RangeError);
    });
  });

  describe('when a stored version breaks an invariant', () => {
    const id = createVersionId(1730000000000, 2);
    const owed = storageObjectPath('resume', createVersionId(1730000000000, 1));

    /**
     * @param entry one versions row
     * @returns the parse result
     */
    function read(entry: unknown): ReturnType<typeof parseCatalog> {
      return parseCatalog('resume', { versions: [entry] });
    }

    it('should keep a pending delete that names another file', () => {
      const parsed = read({
        id,
        uploadedAt: SEEDED_AT,
        storagePath: storageObjectPath('resume', id),
        downloadUrl: 'https://files.example/current',
        pendingDeletes: [owed],
      });

      expect(parsed.ok).toBe(true);
      if (!parsed.ok) {
        return;
      }
      expect(parsed.catalog.versions[0].pendingDeletes).toEqual([owed]);
    });

    it('should reject a row that is not a stored version', () => {
      const path = storageObjectPath('resume', id);
      const valid = {
        id,
        uploadedAt: SEEDED_AT,
        storagePath: path,
        downloadUrl: 'https://files.example/current',
        pendingDeletes: [] as string[],
      };
      const bodies: unknown[] = [
        'text',
        { versions: 'nope' },
        null,
        { id: 4 },
        { ...valid, id: 'nope' },
        { ...valid, id: '0001-000001' },
        { ...valid, id: '9007199254740993-000001' },
        { ...valid, uploadedAt: '' },
        { ...valid, uploadedAt: 4 },
        { ...valid, storagePath: 'portfolio/documents/resume/other.pdf' },
        { ...valid, downloadUrl: '' },
        { ...valid, pendingDeletes: 'none' },
        { ...valid, pendingDeletes: [4] },
        { ...valid, pendingDeletes: [path] },
        { ...valid, pendingDeletes: ['portfolio/documents/cover-letter/nope.docx'] },
      ];

      bodies.forEach((body) => {
        expect(read(body).ok).toBe(false);
      });
      expect(parseCatalog('resume', []).ok).toBe(false);
      expect(parseCatalog('resume', { versions: [valid, valid] }).ok).toBe(false);
      expect(parseCatalog('resume', { versions: [{ id: 4 }, valid] }).ok).toBe(false);
      expect(read({
        ...valid,
        pendingDeletes: ['portfolio/documents/resume/resume-0001-000001.pdf', owed],
      }).ok).toBe(false);
      expect(read({
        ...valid,
        pendingDeletes: [4, owed],
      }).ok).toBe(false);
    });

    it('should keep a cover-letter pending delete that names another file', () => {
      const coverId = createVersionId(1730000000000, 3);
      const otherId = createVersionId(1730000000000, 4);
      const parsed = parseCatalog('cover-letter', {
        versions: [{
          id: coverId,
          uploadedAt: SEEDED_AT,
          storagePath: storageObjectPath('cover-letter', coverId),
          downloadUrl: 'https://files.example/letter',
          pendingDeletes: [storageObjectPath('cover-letter', otherId)],
        }],
      });

      expect(parsed.ok).toBe(true);
    });
  });
});
