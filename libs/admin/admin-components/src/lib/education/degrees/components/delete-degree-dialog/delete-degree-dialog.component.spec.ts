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

import { IEducation } from '@portfolio-v2/state/dataModels';
import { DeleteDegreeDialogComponent } from './delete-degree-dialog.component';
import {
  DegreeWriteError,
  DegreeWriter,
} from '../../services/degree-writer.service';

/** The degree to delete. */
const degree: IEducation = {
  id: 3,
  title: 'University of Nebraska at Omaha',
  period: '2021 - 2023',
  degree: 'MASTER OF SCIENCE (MSc) IN COMPUTER SCIENCE',
  gpa: '3.952',
  awards: 'GRACA grant',
  credits: '30/30',
  graduated: '19th of May 2023',
  extra: '',
};

/** Assigned before the host is created. The test module itself does not provide the writer. */
let writerForHost: DegreeWriter;

/**
 * @returns the writer provided on the host, standing in for the degrees route
 */
function writerFromRoute(): DegreeWriter {
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
 * Stands in for the degrees page. The writer lives on this injector, as it does on the route.
 */
@Component({
  selector: 'admin-delete-degree-dialog-host',
  standalone: true,
  template: '',
  providers: [{ provide: DegreeWriter, useFactory: writerFromRoute }],
})
class DeleteDegreeDialogHost {
  /** The dialog to open. */
  private readonly dialog = inject(MatDialog);

  /** The view container to use for the dialog. */
  private readonly viewContainerRef = inject(ViewContainerRef);

  /**
   * Open the dialog the way the degrees page does.
   * @returns the open dialog
   */
  public open(): MatDialogRef<DeleteDegreeDialogComponent, boolean> {
    return this.dialog.open(DeleteDegreeDialogComponent, {
      viewContainerRef: this.viewContainerRef,
      data: degree,
    });
  }
}

describe('DeleteDegreeDialogComponent', () => {
  let fixture: ComponentFixture<DeleteDegreeDialogHost>;
  let host: DeleteDegreeDialogHost;
  let writer: jest.Mocked<DegreeWriter>;

  beforeEach(async () => {
    writer = createSpyObj(DegreeWriter);
    writer.remove.mockResolvedValue(undefined);
    writerForHost = writer;

    await TestBed.configureTestingModule({
      imports: [DeleteDegreeDialogHost, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteDegreeDialogHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
  });

  it('should name the degree and delete nothing until confirmed', () => {
    host.open();
    fixture.detectChanges();

    expect(document.body.textContent).toContain('Delete degree');
    expect(document.body.textContent).toContain('University of Nebraska at Omaha');
    expect(document.body.textContent).toContain('MASTER OF SCIENCE (MSc) IN COMPUTER SCIENCE');
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

  it('should remove the degree and close with true when confirmed', async () => {
    const ref = host.open();
    fixture.detectChanges();

    const closed = firstValueFrom(ref.afterClosed());
    dialogButton('Delete').click();

    expect(await closed).toBe(true);
    expect(writer.remove).toHaveBeenCalledWith(degree);
  });

  it('should stay open and show the message when the removal fails', async () => {
    writer.remove.mockRejectedValue(new DegreeWriteError('unauthenticated'));
    const ref = host.open();
    fixture.detectChanges();

    dialogButton('Delete').click();
    await fixture.whenStable();
    ref.componentRef?.changeDetectorRef.detectChanges();

    expect(ref.getState()).toBe(MatDialogState.OPEN);
    expect(document.body.textContent).toContain('Sign in before changing degrees.');
    expect(dialogButton('Delete').disabled).toBe(false);
  });
});
