import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  FormControl,
  Validators,
} from '@angular/forms';

import { DisplayValidatorErrorsComponent } from './display-validator-errors.component';

describe('DisplayValidatorErrorsComponent', () => {
  let component: DisplayValidatorErrorsComponent;
  let fixture: ComponentFixture<DisplayValidatorErrorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayValidatorErrorsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisplayValidatorErrorsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should show the message after the control is marked touched', () => {
    const control = new FormControl('', Validators.required);
    component.control = control;
    component.errorKey = 'required';
    component.message = 'A title is required';
    fixture.detectChanges();

    control.markAsTouched();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('A title is required');
  });
});
