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
  EditTarget,
  IPublication,
  IPublicationDetails,
  joinPublications,
} from '@portfolio-v2/state/dataModels';
import { PublicationDialogComponent } from './publication-dialog.component';
import {
  PublicationWriteError,
  PublicationWriter,
} from '../../services/publication-writer.service';

/** Card document of the publication to edit. */
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

/** Details document of the publication to edit. */
const detail: IPublicationDetails = {
  id: 1,
  title: 'ARWalker: A Virtual Walking Companion Application',
  authors: 'Authors',
  abstarct: ['A paragraph.'],
  citation: 'citation',
};

/** The joined record the dialog edits. */
const publication = joinPublications([card], [detail])[0];

/** The target for the edit dialog. */
const editTarget: EditTarget = { mode: 'edit', publication };

/** Assigned before the host is created. The test module itself does not provide the writer. */
let writerForHost: PublicationWriter;

/**
 * @returns the writer provided on the host, standing in for the education route
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
  selector: 'admin-publication-dialog-host',
  standalone: true,
  template: '',
  providers: [{ provide: PublicationWriter, useFactory: writerFromRoute }],
})
class PublicationDialogHost {
  /** The dialog to open. */
  private readonly dialog = inject(MatDialog);

  /** The view container to use for the dialog. */
  private readonly viewContainerRef = inject(ViewContainerRef);

  /**
   * Open the dialog the way the publications page does.
   * @param target record the dialog edits
   * @returns the open dialog
   */
  public open(target: EditTarget): MatDialogRef<PublicationDialogComponent, boolean> {
    return this.dialog.open(PublicationDialogComponent, {
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      width: '800px',
      viewContainerRef: this.viewContainerRef,
      data: target,
    });
  }
}

/**
 * Let the form apply the record before a button is clicked.
 * @param hostFixture host fixture
 * @param ref open dialog
 */
async function ready(
  hostFixture: ComponentFixture<PublicationDialogHost>,
  ref: MatDialogRef<PublicationDialogComponent, boolean>,
): Promise<void> {
  hostFixture.detectChanges();
  await hostFixture.whenStable();
  ref.componentRef?.changeDetectorRef.detectChanges();
}

describe('PublicationDialogComponent', () => {
  let fixture: ComponentFixture<PublicationDialogHost>;
  let host: PublicationDialogHost;
  let writer: jest.Mocked<PublicationWriter>;

  beforeEach(async () => {
    writer = createSpyObj(PublicationWriter);
    writer.save.mockResolvedValue(publication);
    writerForHost = writer;

    await TestBed.configureTestingModule({
      imports: [PublicationDialogHost, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicationDialogHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
  });

  it('resolves the route writer when the page supplies its view container', () => {
    const ref = host.open(editTarget);

    expect(ref.componentInstance).toBeInstanceOf(PublicationDialogComponent);
    expect(() => {
      TestBed.inject(MatDialog).open(PublicationDialogComponent, { data: editTarget });
    }).toThrow(/PublicationWriter/);
  });

  it('closes after the publication is saved', async () => {
    const ref = host.open(editTarget);

    await ready(fixture, ref);

    const closed = firstValueFrom(ref.afterClosed());

    dialogButton('Save').click();

    expect(await closed).toBe(true);
    expect(writer.save).toHaveBeenCalledWith(expect.objectContaining({
      title: 'ARWalker',
      id: publication.id,
    }));
  });

  it('stays open and shows the message when the save fails', async () => {
    writer.save.mockRejectedValue(new PublicationWriteError('unauthenticated'));
    const ref = host.open(editTarget);

    await ready(fixture, ref);

    dialogButton('Save').click();
    await fixture.whenStable();

    ref.componentRef?.changeDetectorRef.detectChanges();

    expect(ref.getState()).toBe(MatDialogState.OPEN);
    expect(document.body.textContent).toContain('Sign in before changing publications.');
    expect(writer.save).toHaveBeenCalled();
  });
});
