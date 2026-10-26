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

import { ICertificateCard } from '@portfolio-v2/state/dataModels';
import { DeleteCertificateDialogComponent } from './delete-certificate-dialog.component';
import {
  CertificateWriteError,
  CertificateWriter,
} from '../../services/certificate-writer.service';

/** The certificate to delete. */
const certificate: ICertificateCard = {
  id: 3,
  title: 'Web Development Bootcamp',
  completedDate: 'In progress',
  organization: 'Udemy',
  credentialID: 'None',
  certification: 'In Progress',
  certificateURL: '',
  description: 'An introductory course.',
};

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
  selector: 'admin-delete-certificate-dialog-host',
  standalone: true,
  template: '',
  providers: [{ provide: CertificateWriter, useFactory: writerFromRoute }],
})
class DeleteCertificateDialogHost {
  /** The dialog to open. */
  private readonly dialog = inject(MatDialog);

  /** The view container to use for the dialog. */
  private readonly viewContainerRef = inject(ViewContainerRef);

  /**
   * Open the dialog the way the certificates page does.
   * @returns the open dialog
   */
  public open(): MatDialogRef<DeleteCertificateDialogComponent, boolean> {
    return this.dialog.open(DeleteCertificateDialogComponent, {
      viewContainerRef: this.viewContainerRef,
      data: certificate,
    });
  }
}

describe('DeleteCertificateDialogComponent', () => {
  let fixture: ComponentFixture<DeleteCertificateDialogHost>;
  let host: DeleteCertificateDialogHost;
  let writer: jest.Mocked<CertificateWriter>;

  beforeEach(async () => {
    writer = createSpyObj(CertificateWriter);
    writer.remove.mockResolvedValue(undefined);
    writerForHost = writer;

    await TestBed.configureTestingModule({
      imports: [DeleteCertificateDialogHost, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteCertificateDialogHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
  });

  it('should name the certificate and delete nothing until confirmed', () => {
    host.open();
    fixture.detectChanges();

    expect(document.body.textContent).toContain('Delete certificate');
    expect(document.body.textContent).toContain('Web Development Bootcamp');
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

  it('should remove the certificate and close with true when confirmed', async () => {
    const ref = host.open();
    fixture.detectChanges();

    const closed = firstValueFrom(ref.afterClosed());
    dialogButton('Delete').click();

    expect(await closed).toBe(true);
    expect(writer.remove).toHaveBeenCalledWith(certificate);
  });

  it('should stay open and show the message when the removal fails', async () => {
    writer.remove.mockRejectedValue(new CertificateWriteError('unauthenticated'));
    const ref = host.open();
    fixture.detectChanges();

    dialogButton('Delete').click();
    await fixture.whenStable();
    ref.componentRef?.changeDetectorRef.detectChanges();

    expect(ref.getState()).toBe(MatDialogState.OPEN);
    expect(document.body.textContent).toContain('Sign in before changing certificates.');
    expect(dialogButton('Delete').disabled).toBe(false);
  });
});
