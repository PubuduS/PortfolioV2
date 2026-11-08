import {
  Component,
  inject,
  Injectable,
  ViewContainerRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MatDialog,
  MatDialogState,
} from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { firstValueFrom } from 'rxjs';

import { AdminDeleteDialogComponent } from './admin-delete-dialog.component';
import { type AdminDeleteDialogData } from './admin-delete-dialog.data';

/** Record the dialog removes. */
const record = { id: 4, title: 'Angular' };

/**
 * Writer provided on the host, standing in for a route writer.
 */
@Injectable()
class StubRemover {
  /** Records passed to remove. */
  public readonly removed: unknown[] = [];

  /** Next remove failure. Null lets the delete succeed. */
  public failure: Error | null = null;

  /**
   * Record the delete, or throw the prepared failure.
   * @param value record the dialog holds
   */
  public async remove(value: unknown): Promise<void> {
    if (this.failure) {
      throw this.failure;
    }
    this.removed.push(value);
  }
}

/** Assigned before the host is created. */
let removerForHost: StubRemover;

/**
 * @returns the writer provided on the host
 */
function removerFromRoute(): StubRemover {
  return removerForHost;
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
 * Stands in for a list page. The writer lives on this injector.
 */
@Component({
  selector: 'admin-delete-dialog-host',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: StubRemover, useFactory: removerFromRoute }],
})
class DeleteDialogHost {
  /** The dialog to open. */
  private readonly dialog = inject(MatDialog);

  /** The view container to use for the dialog. */
  private readonly viewContainerRef = inject(ViewContainerRef);

  /**
   * Open the delete dialog the way a list page does.
   * @returns the open dialog
   */
  public open(): ReturnType<MatDialog['open']> {
    const data: AdminDeleteDialogData<typeof record> = {
      title: 'Delete certificate',
      lines: [record.title, 'Training'],
      record,
      writer: StubRemover,
      writeMessage: () => 'Sign in before changing certificates.',
    };
    return this.dialog.open(AdminDeleteDialogComponent, {
      viewContainerRef: this.viewContainerRef,
      data,
    });
  }
}

describe('AdminDeleteDialogComponent', () => {
  let fixture: ComponentFixture<DeleteDialogHost>;
  let host: DeleteDialogHost;
  let remover: StubRemover;

  beforeEach(async () => {
    remover = new StubRemover();
    removerForHost = remover;

    await TestBed.configureTestingModule({
      imports: [DeleteDialogHost, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteDialogHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
  });

  it('should show each line and close after the record is removed', async () => {
    const ref = host.open();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.body.textContent).toContain('Delete certificate');
    expect(document.body.textContent).toContain('Angular');
    expect(document.body.textContent).toContain('Training');

    const closed = firstValueFrom(ref.afterClosed());
    dialogButton('Delete').click();

    expect(await closed).toBe(true);
    expect(remover.removed).toEqual([record]);
  });

  it('should stay open when the writer fails', async () => {
    remover.failure = new Error('unauthenticated');
    const ref = host.open();
    fixture.detectChanges();
    await fixture.whenStable();

    dialogButton('Delete').click();
    await fixture.whenStable();
    ref.componentRef?.changeDetectorRef.detectChanges();

    expect(ref.getState()).toBe(MatDialogState.OPEN);
    expect(document.body.textContent).toContain('Sign in before changing certificates.');
  });

  it('should refuse to open without the route writer', () => {
    expect(() => {
      TestBed.inject(MatDialog).open(AdminDeleteDialogComponent, {
        data: {
          title: 'Delete certificate',
          lines: [record.title],
          record,
          writer: StubRemover,
          writeMessage: () => 'failed',
        },
      });
    }).toThrow(/StubRemover/);
  });
});
