import {
  Component,
  inject,
  ViewContainerRef,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MatDialog,
  MatDialogRef,
  MatDialogState,
} from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createSpyObj } from 'jest-createspyobj';
import { firstValueFrom } from 'rxjs';

import {
  createVersionId,
  DocumentWriteError,
  storageObjectPath,
  type DeleteDocumentRequest,
  type DocumentVersion,
} from '@portfolio-v2/state/dataModels';
import { DeleteDocumentDialogComponent } from './delete-document-dialog.component';
import { DocumentWriter } from '../../services/document-writer.service';

const versionId = createVersionId(1730000000000, 2);

/** The older version the dialog removes. */
const version: DocumentVersion = {
  id: versionId,
  uploadedAt: '2026-01-01T00:00:00.000Z',
  storagePath: storageObjectPath('resume', versionId),
  downloadUrl: 'https://files.example/older',
  pendingDeletes: [],
};

/** Dialog payload. */
const request: DeleteDocumentRequest = {
  kind: 'resume',
  version,
};

/** Assigned before the host is created. The test module itself does not provide the writer. */
let writerForHost: DocumentWriter;

/**
 * @returns the writer provided on the host, standing in for the documents route
 */
function writerFromRoute(): DocumentWriter {
  return writerForHost;
}

/**
 * @param label button label
 * @returns the button in the open dialog
 */
function dialogButton(label: string): HTMLButtonElement {
  const button = [...document.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === label,
  );
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`missing ${label} button`);
  }
  return button;
}

/**
 * Stands in for the documents page. The writer lives on this injector, as it does on the route.
 */
@Component({
  selector: 'admin-delete-document-dialog-host',
  standalone: true,
  template: '',
  providers: [{ provide: DocumentWriter, useFactory: writerFromRoute }],
})
class DeleteDocumentDialogHost {
  /** The dialog to open. */
  private readonly dialog = inject(MatDialog);

  /** The view container to use for the dialog. */
  private readonly viewContainerRef = inject(ViewContainerRef);

  /**
   * Open the dialog the way the documents page does.
   * @returns the open dialog
   */
  public open(): MatDialogRef<DeleteDocumentDialogComponent, boolean> {
    return this.dialog.open(DeleteDocumentDialogComponent, {
      viewContainerRef: this.viewContainerRef,
      data: request,
    });
  }
}

describe('DeleteDocumentDialogComponent', () => {
  let fixture: ComponentFixture<DeleteDocumentDialogHost>;
  let host: DeleteDocumentDialogHost;
  let writer: jest.Mocked<DocumentWriter>;

  beforeEach(async () => {
    writer = createSpyObj(DocumentWriter);
    writer.remove.mockResolvedValue(undefined);
    writerForHost = writer;

    await TestBed.configureTestingModule({
      imports: [DeleteDocumentDialogHost, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteDocumentDialogHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
  });

  it('should name the version and delete nothing until confirmed', () => {
    host.open();
    fixture.detectChanges();

    expect(document.body.textContent).toContain('Delete version');
    expect(document.body.textContent).toContain('2026-01-01T00:00:00.000Z');
    expect(writer.remove).not.toHaveBeenCalled();
  });

  it('should close without deleting when cancelled', async () => {
    const ref = host.open();
    fixture.detectChanges();

    const closed = firstValueFrom(ref.afterClosed());
    dialogButton('Cancel').click();

    expect(await closed).not.toBe(true);
    expect(writer.remove).not.toHaveBeenCalled();
  });

  it('should remove the version and close with true when confirmed', async () => {
    const ref = host.open();
    fixture.detectChanges();

    const closed = firstValueFrom(ref.afterClosed());
    dialogButton('Delete').click();

    expect(await closed).toBe(true);
    expect(writer.remove).toHaveBeenCalledWith('resume', version);
  });

  it('should stay open and show the message when the removal fails', async () => {
    writer.remove.mockRejectedValue(new DocumentWriteError('protected', 'resume'));
    const ref = host.open();
    fixture.detectChanges();

    dialogButton('Delete').click();
    await fixture.whenStable();
    ref.componentRef?.changeDetectorRef.detectChanges();

    expect(ref.getState()).toBe(MatDialogState.OPEN);
    expect(document.body.textContent).toContain('The only version cannot be deleted.');
    expect(dialogButton('Delete').disabled).toBe(false);
  });
});
