import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
MAT_DIALOG_DATA,
MatDialogRef
} from '@angular/material/dialog'

import { ContactPopupComponent } from './contact_popup.component';

describe('ContactPopupComponent', () => {
  let fixture: ComponentFixture<ContactPopupComponent>;
  let dialogRef: { close: jest.Mock };

  beforeEach(async () => {
    dialogRef = { close: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [ContactPopupComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { emailAddr: 'me@example.com' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactPopupComponent);
    fixture.detectChanges();
  });

  it('should show the email address', () => {
    expect(fixture.nativeElement.textContent).toContain('me@example.com');
    expect(fixture.componentInstance.email).toBe('me@example.com');
  });

  it('should close when the close control is clicked', () => {
    const close = fixture.nativeElement.querySelector('.btn');
    if (!(close instanceof HTMLElement)) {
      throw new Error('missing close control');
    }

    close.click();

    expect(dialogRef.close).toHaveBeenCalled();
  });
});
