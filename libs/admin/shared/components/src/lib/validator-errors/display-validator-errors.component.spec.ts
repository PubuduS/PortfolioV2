import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
