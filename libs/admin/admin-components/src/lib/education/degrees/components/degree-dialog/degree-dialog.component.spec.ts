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
  EducationEditTarget,
  IEducation,
} from '@portfolio-v2/state/dataModels';
import { DegreeDialogComponent } from './degree-dialog.component';
import {
  DegreeWriteError,
  DegreeWriter,
} from '../../services/degree-writer.service';

/** The degree to edit. */
const degree: IEducation = {
  id: 2,
  title: 'South Dakota State University',
  period: '2016 - 2019',
  degree: 'BACHELOR OF SCIENCE (BSc) IN COMPUTER SCIENCE',
  gpa: '3.537',
  awards: 'Spring 2019',
  credits: '149/120',
  graduated: '04th of May 2019',
  extra: '',
};

/** The target for the edit dialog. */
const editTarget: EducationEditTarget = { mode: 'edit', education: degree };

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
  selector: 'admin-degree-dialog-host',
  standalone: true,
  template: '',
  providers: [{ provide: DegreeWriter, useFactory: writerFromRoute }],
})
class DegreeDialogHost {
  /** The dialog to open. */
  private readonly dialog = inject(MatDialog);

  /** The view container to use for the dialog. */
  private readonly viewContainerRef = inject(ViewContainerRef);

  /**
   * Open the dialog the way the degrees page does.
   * @param target record the dialog edits
   * @returns the open dialog
   */
  public open(target: EducationEditTarget): MatDialogRef<DegreeDialogComponent, boolean> {
    return this.dialog.open(DegreeDialogComponent, {
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
  hostFixture: ComponentFixture<DegreeDialogHost>,
  ref: MatDialogRef<DegreeDialogComponent, boolean>,
): Promise<void> {
  hostFixture.detectChanges();
  await hostFixture.whenStable();
  ref.componentRef?.changeDetectorRef.detectChanges();
}

describe('DegreeDialogComponent', () => {
  let fixture: ComponentFixture<DegreeDialogHost>;
  let host: DegreeDialogHost;
  let writer: jest.Mocked<DegreeWriter>;

  beforeEach(async () => {
    writer = createSpyObj(DegreeWriter);
    writer.save.mockResolvedValue(degree);
    writerForHost = writer;

    await TestBed.configureTestingModule({
      imports: [DegreeDialogHost, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DegreeDialogHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
  });

  it('should resolve the route writer when the page supplies its view container', () => {
    const ref = host.open(editTarget);

    expect(ref.componentInstance).toBeInstanceOf(DegreeDialogComponent);
    expect(() => {
      TestBed.inject(MatDialog).open(DegreeDialogComponent, { data: editTarget });
    }).toThrow(/DegreeWriter/);
  });

  it.each([
    ['new', { mode: 'new', id: 4 } satisfies EducationEditTarget, 'New degree'],
    ['edit', editTarget, 'Edit degree'],
  ])('should title the %s dialog %s', async (_mode, target, heading) => {
    const ref = host.open(target);

    await ready(fixture, ref);

    expect(document.body.textContent).toContain(heading);
  });

  it('should close after the degree is saved', async () => {
    const ref = host.open(editTarget);

    await ready(fixture, ref);

    const closed = firstValueFrom(ref.afterClosed());

    dialogButton('Save').click();

    expect(await closed).toBe(true);
    expect(writer.save).toHaveBeenCalledWith(degree);
  });

  it('should not call the writer while the form is invalid', async () => {
    const ref = host.open({ mode: 'new', id: 4 });

    await ready(fixture, ref);

    dialogButton('Save').click();
    await fixture.whenStable();

    expect(writer.save).not.toHaveBeenCalled();
    expect(ref.getState()).toBe(MatDialogState.OPEN);
  });

  it('should stay open and show the message when the save fails', async () => {
    writer.save.mockRejectedValue(new DegreeWriteError('unauthenticated'));
    const ref = host.open(editTarget);

    await ready(fixture, ref);

    dialogButton('Save').click();
    await fixture.whenStable();

    ref.componentRef?.changeDetectorRef.detectChanges();

    expect(ref.getState()).toBe(MatDialogState.OPEN);
    expect(document.body.textContent).toContain('Sign in before changing degrees.');
    expect(writer.save).toHaveBeenCalled();
  });

  it('should show the generic message when the batch fails', async () => {
    writer.save.mockRejectedValue(new DegreeWriteError('commit-failed'));
    const ref = host.open(editTarget);

    await ready(fixture, ref);

    dialogButton('Save').click();
    await fixture.whenStable();

    ref.componentRef?.changeDetectorRef.detectChanges();

    expect(document.body.textContent).toContain('The degree could not be saved.');
  });
});
