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
  IPublication,
  IPublicationDetails,
  joinPublications,
} from '@portfolio-v2/state/dataModels';
import { DeletePublicationDialogComponent } from './delete-publication-dialog.component';
import {
  PublicationWriteError,
  PublicationWriter,
} from '../../services/publication-writer.service';

/** Card document of the publication to delete. */
const card: IPublication = {
  id: 1,
  title: 'ARWalker',
  subTitle: 'keywords',
  imageUrl: 'storage://portfolio/publications/publication-card-images/ID-01-Image.webp',
  shortDesc: 'summary',
  btnMoreDisable: false,
  btnDownloadDisable: false,
  downloadUrl: 'storage://portfolio/publications/papers/ID-01-Paper.pdf',
  downloadFileName: 'ARWalker',
};

/** Details document of the publication to delete. */
const detail: IPublicationDetails = {
  id: 1,
  title: 'ARWalker: A Virtual Walking Companion Application',
  authors: 'Authors',
  abstarct: ['A paragraph.'],
  citation: 'citation',
};

/** The joined record the dialog deletes. */
const publication = joinPublications([card], [detail])[0];

/** Assigned before the host is created. The test module itself does not provide the writer. */
let writerForHost: PublicationWriter;

/**
 * @returns the writer provided on the host, standing in for the publications route
 */
function writerFromRoute(): PublicationWriter {
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
 * Stands in for the publications page. The writer lives on this injector, as it does on the route.
 */
@Component({
  selector: 'admin-delete-publication-dialog-host',
  standalone: true,
  template: '',
  providers: [{ provide: PublicationWriter, useFactory: writerFromRoute }],
})
class DeletePublicationDialogHost {
  /** The dialog to open. */
  private readonly dialog = inject(MatDialog);

  /** The view container to use for the dialog. */
  private readonly viewContainerRef = inject(ViewContainerRef);

  /**
   * Open the dialog the way the publications page does.
   * @returns the open dialog
   */
  public open(): MatDialogRef<DeletePublicationDialogComponent, boolean> {
    return this.dialog.open(DeletePublicationDialogComponent, {
      viewContainerRef: this.viewContainerRef,
      data: publication,
    });
  }
}

describe('DeletePublicationDialogComponent', () => {
  let fixture: ComponentFixture<DeletePublicationDialogHost>;
  let host: DeletePublicationDialogHost;
  let writer: jest.Mocked<PublicationWriter>;

  beforeEach(async () => {
    writer = createSpyObj(PublicationWriter);
    writer.remove.mockResolvedValue(undefined);
    writerForHost = writer;

    await TestBed.configureTestingModule({
      imports: [DeletePublicationDialogHost, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DeletePublicationDialogHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
  });

  it('should name the publication and delete nothing until confirmed', () => {
    host.open();
    fixture.detectChanges();

    expect(document.body.textContent).toContain('Delete publication');
    expect(document.body.textContent).toContain('ARWalker');
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

  it('should remove the publication and close with true when confirmed', async () => {
    const ref = host.open();
    fixture.detectChanges();

    const closed = firstValueFrom(ref.afterClosed());
    dialogButton('Delete').click();

    expect(await closed).toBe(true);
    expect(writer.remove).toHaveBeenCalledWith(publication);
  });

  it('should disable both buttons while the delete is in flight', async () => {
    let finish = (): void => undefined;
    writer.remove.mockReturnValue(new Promise<void>((resolve) => {
      finish = (): void => {
        resolve();
      };
    }));
    const ref = host.open();
    fixture.detectChanges();

    dialogButton('Delete').click();
    ref.componentRef?.changeDetectorRef.detectChanges();

    expect(dialogButton('Delete').disabled).toBe(true);
    expect(dialogButton('Cancel').disabled).toBe(true);

    finish();
    await fixture.whenStable();
  });

  it('should stay open and show the message when the removal fails', async () => {
    writer.remove.mockRejectedValue(new PublicationWriteError('unauthenticated'));
    const ref = host.open();
    fixture.detectChanges();

    dialogButton('Delete').click();
    await fixture.whenStable();
    ref.componentRef?.changeDetectorRef.detectChanges();

    expect(ref.getState()).toBe(MatDialogState.OPEN);
    expect(document.body.textContent).toContain('Sign in before changing publications.');
    expect(dialogButton('Delete').disabled).toBe(false);
  });
});
