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
  CertificateEditTarget,
  ICertificateCard,
} from '@portfolio-v2/state/dataModels';
import { CertificateDialogComponent } from './certificate-dialog.component';
import {
  CertificateWriteError,
  CertificateWriter,
} from '../../services/certificate-writer.service';

/** The certificate to edit. */
const certificate: ICertificateCard = {
  id: 7,
  title: 'Angular Level 1 Certification',
  completedDate: '02/21/2024',
  organization: 'Angular Training',
  credentialID: '5A20CF0',
  certification: 'Here',
  certificateURL: 'https://interstate21.com/certificate/?code=5A20CF0',
  description: 'A professional certification.',
};

/** The target for the edit dialog. */
const editTarget: CertificateEditTarget = { mode: 'edit', certificate };

/** Assigned before the host is created. The test module itself does not provide the writer. */
let writerForHost: CertificateWriter;

/**
 * @returns the writer provided on the host, standing in for the certificates route
 */
function writerFromRoute(): CertificateWriter {
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
 * Stands in for the certificates page. The writer lives on this injector, as it does on the route.
 */
@Component({
  selector: 'admin-certificate-dialog-host',
  standalone: true,
  template: '',
  providers: [{ provide: CertificateWriter, useFactory: writerFromRoute }],
})
class CertificateDialogHost {
  /** The dialog to open. */
  private readonly dialog = inject(MatDialog);

  /** The view container to use for the dialog. */
  private readonly viewContainerRef = inject(ViewContainerRef);

  /**
   * Open the dialog the way the certificates page does.
   * @param target record the dialog edits
   * @returns the open dialog
   */
  public open(target: CertificateEditTarget): MatDialogRef<CertificateDialogComponent, boolean> {
    return this.dialog.open(CertificateDialogComponent, {
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
  hostFixture: ComponentFixture<CertificateDialogHost>,
  ref: MatDialogRef<CertificateDialogComponent, boolean>,
): Promise<void> {
  hostFixture.detectChanges();
  await hostFixture.whenStable();
  ref.componentRef?.changeDetectorRef.detectChanges();
}

describe('CertificateDialogComponent', () => {
  let fixture: ComponentFixture<CertificateDialogHost>;
  let host: CertificateDialogHost;
  let writer: jest.Mocked<CertificateWriter>;

  beforeEach(async () => {
    writer = createSpyObj(CertificateWriter);
    writer.save.mockResolvedValue(certificate);
    writerForHost = writer;

    await TestBed.configureTestingModule({
      imports: [CertificateDialogHost, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CertificateDialogHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
  });

  it('should resolve the route writer when the page supplies its view container', () => {
    const ref = host.open(editTarget);

    expect(ref.componentInstance).toBeInstanceOf(CertificateDialogComponent);
    expect(() => {
      TestBed.inject(MatDialog).open(CertificateDialogComponent, { data: editTarget });
    }).toThrow(/CertificateWriter/);
  });

  it.each([
    ['new', { mode: 'new', id: 8 } satisfies CertificateEditTarget, 'New certificate'],
    ['edit', editTarget, 'Edit certificate'],
  ])('should title the %s dialog %s', async (_mode, target, heading) => {
    const ref = host.open(target);

    await ready(fixture, ref);

    expect(document.body.textContent).toContain(heading);
  });

  it('should close after the certificate is saved', async () => {
    const ref = host.open(editTarget);

    await ready(fixture, ref);

    const closed = firstValueFrom(ref.afterClosed());

    dialogButton('Save').click();

    expect(await closed).toBe(true);
    expect(writer.save).toHaveBeenCalledWith(certificate);
  });

  it('should not call the writer while the form is invalid', async () => {
    const ref = host.open({ mode: 'new', id: 8 });

    await ready(fixture, ref);

    dialogButton('Save').click();
    await fixture.whenStable();

    expect(writer.save).not.toHaveBeenCalled();
    expect(ref.getState()).toBe(MatDialogState.OPEN);
  });

  it('should stay open and show the message when the save fails', async () => {
    writer.save.mockRejectedValue(new CertificateWriteError('unauthenticated'));
    const ref = host.open(editTarget);

    await ready(fixture, ref);

    dialogButton('Save').click();
    await fixture.whenStable();

    ref.componentRef?.changeDetectorRef.detectChanges();

    expect(ref.getState()).toBe(MatDialogState.OPEN);
    expect(document.body.textContent).toContain('Sign in before changing certificates.');
    expect(writer.save).toHaveBeenCalled();
  });

  it('should show the generic message when the batch fails', async () => {
    writer.save.mockRejectedValue(new CertificateWriteError('commit-failed'));
    const ref = host.open(editTarget);

    await ready(fixture, ref);

    dialogButton('Save').click();
    await fixture.whenStable();

    ref.componentRef?.changeDetectorRef.detectChanges();

    expect(document.body.textContent).toContain('The certificate could not be saved.');
  });
});
