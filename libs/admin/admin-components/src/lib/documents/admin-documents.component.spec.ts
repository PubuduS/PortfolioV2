import {
  signal,
  ViewContainerRef,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  ActivatedRoute,
  provideRouter,
} from '@angular/router';
import { createSpyObj } from 'jest-createspyobj';
import { of } from 'rxjs';

import { DocumentCatalogReader } from '@portfolio-v2/shared/services';
import {
  applyCatalogCommand,
  createVersionId,
  DocumentWriteError,
  parseCatalog,
  type CatalogView,
  type DocumentCatalog,
} from '@portfolio-v2/state/dataModels';
import { AdminDocumentsComponent } from './admin-documents.component';
import { DocumentWriter } from './services/document-writer.service';

/**
 * @returns a ready resume catalog with a current row and one older row
 */
function resumeCatalog(): DocumentCatalog {
  let current: unknown;
  ['2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z'].forEach((uploadedAt, index) => {
    const result = applyCatalogCommand('resume', current, {
      type: 'upload',
      attempt: {
        id: createVersionId(1730000000000, index + 1),
        uploadedAt,
        downloadUrl: `https://files.example/${index + 1}`,
      },
    });
    if (!result.ok || result.wire === null) {
      throw new Error('resume fixture did not insert');
    }
    current = result.wire;
  });
  const parsed = parseCatalog('resume', current);
  if (!parsed.ok) {
    throw new Error('resume fixture is unreadable');
  }
  return parsed.catalog;
}

/**
 * @param root page element
 * @param label button text
 * @returns the button
 */
function buttonNamed(root: ParentNode, label: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === label,
  );
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`missing ${label} button`);
  }
  return button;
}

describe('AdminDocumentsComponent', () => {
  let fixture: ComponentFixture<AdminDocumentsComponent>;
  let writer: jest.Mocked<DocumentWriter>;
  let view: ReturnType<typeof signal<CatalogView>>;
  const catalog = resumeCatalog();

  beforeEach(async () => {
    writer = createSpyObj(DocumentWriter);
    writer.upload.mockResolvedValue(undefined);
    writer.remove.mockResolvedValue(undefined);
    view = signal<CatalogView>({ status: 'ready', catalog });
    const reader = {
      view: () => view,
    };

    TestBed.configureTestingModule({
      imports: [AdminDocumentsComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: DocumentCatalogReader, useValue: reader },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ kind: 'resume' }),
            snapshot: { data: { kind: 'resume' } },
          },
        },
      ],
    });
    TestBed.overrideComponent(AdminDocumentsComponent, {
      add: {
        providers: [{ provide: DocumentWriter, useValue: writer }],
      },
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(AdminDocumentsComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
  });

  it('should enable delete on every row when a previous version remains', () => {
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain('Resume');
    expect(page.textContent).toContain('Cover Letter');
    expect(page.querySelector('a[href="/admin/coverletter"]')?.textContent?.trim()).toBe('Cover Letter');
    expect(page.textContent).toContain('2026-01-02 00:00:00');
    expect(page.textContent).toContain('resume_v1');
    expect(page.textContent).toContain('resume_current');
    expect(page.querySelectorAll('button')).toHaveLength(2);

    const rows = [...page.querySelectorAll('tbody tr')];
    expect(rows[0]?.textContent).toContain('resume_v1');
    expect(rows[0]?.textContent).toContain('2026-01-01 00:00:00');
    expect(rows[1]?.textContent).toContain('resume_current');

    const currentRow = rows.find((row) => row.textContent?.includes('resume_current'));
    const currentDelete = currentRow?.querySelector('button');
    expect(currentDelete).toBeInstanceOf(HTMLButtonElement);
    expect(currentDelete?.hasAttribute('disabled')).toBe(false);
    expect(currentDelete?.textContent?.trim()).toBe('Delete');
    expect(currentRow?.querySelector('a')?.textContent?.trim()).toBe('resume_current');
    expect(currentRow?.querySelector('a')?.getAttribute('href')).toBe('https://files.example/2');
    expect(currentRow?.querySelector('a')?.getAttribute('target')).toBe('_blank');
  });

  it('should disable delete when the current version is the only one', () => {
    view.set({
      status: 'ready',
      catalog: {
        ...catalog,
        versions: [catalog.versions[0]],
      },
    });
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    const button = page.querySelector('tbody button');
    expect(page.textContent).toContain('resume_current');
    expect(page.textContent).not.toContain('resume_v1');
    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button?.hasAttribute('disabled')).toBe(true);
    expect(button?.querySelector('mat-icon')?.textContent?.trim()).toBe('delete');
  });

  it('should open the delete dialog with this page view container', () => {
    const dialog = TestBed.inject(MatDialog);
    const open = jest.spyOn(dialog, 'open');
    buttonNamed(fixture.nativeElement, 'Delete').click();
    fixture.detectChanges();

    const viewContainerRef = fixture.debugElement.injector.get(ViewContainerRef);
    expect(open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        viewContainerRef,
        data: {
          kind: 'resume',
          version: catalog.versions[1],
        },
      }),
    );
    expect(document.body.textContent).toContain('Delete version');
    expect(document.body.textContent).toContain('2026-01-01T00:00:00.000Z');
  });

  it('should not upload when the catalog is unreadable', () => {
    view.set({ status: 'unreadable' });
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="file"]');
    expect(input).toBeInstanceOf(HTMLInputElement);
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));

    expect(writer.upload).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('This version list cannot be read. Nothing was changed.');
  });

  describe('when the version suffix is drawn', () => {
    const file = new File(['%PDF'], 'resume.pdf', { type: 'application/pdf' });

    /**
     * @param draw uint32 stand-in for `crypto.getRandomValues`
     * @returns spy that feeds those draws in order
     */
    function mockDraws(draw: number[]): jest.SpyInstance {
      let index = 0;
      return jest.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
        const values = array as Uint32Array;
        values[0] = draw[index] ?? 0;
        index += 1;
        return array;
      });
    }

    /**
     * @param page document admin element
     */
    async function upload(page: HTMLElement): Promise<void> {
      const input = page.querySelector('input[type="file"]');
      if (!(input instanceof HTMLInputElement)) {
        throw new Error('missing file input');
      }
      Object.defineProperty(input, 'files', { configurable: true, value: [file] });
      input.dispatchEvent(new Event('change'));
      await fixture.whenStable();
    }

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should use a draw below the unbiased uint32 limit', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(1730000000000);
      const random = mockDraws([42]);

      await upload(fixture.nativeElement);

      expect(random).toHaveBeenCalledTimes(1);
      expect(writer.upload.mock.calls[0][2]).toBe(createVersionId(1730000000000, 42));
    });

    it('should draw again when the first value would bias the suffix', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(1730000000000);
      const random = mockDraws([4_294_000_000, 1_000_005]);

      await upload(fixture.nativeElement);

      expect(random).toHaveBeenCalledTimes(2);
      expect(writer.upload.mock.calls[0][2]).toBe(createVersionId(1730000000000, 5));
    });
  });

  it('should reuse the attempt id when the same file is tried again', async () => {
    writer.upload.mockRejectedValue(new DocumentWriteError('upload-failed', 'resume'));
    const input = fixture.nativeElement.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('missing file input');
    }
    const file = new File(['%PDF'], 'resume.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    buttonNamed(fixture.nativeElement, 'Try again').click();
    await fixture.whenStable();

    expect(writer.upload).toHaveBeenCalledTimes(2);
    expect(writer.upload.mock.calls[0][2]).toBe(writer.upload.mock.calls[1][2]);
    expect(writer.upload.mock.calls[0][1]).toBe(file);
    expect(fixture.nativeElement.textContent).toContain('The file did not upload. Nothing was saved.');
  });
});
