import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { UpdateDeleteButtonsComponent } from './update-delete-buttons.component';

describe('UpdateDeleteButtonsComponent', () => {
  let component: UpdateDeleteButtonsComponent;
  let fixture: ComponentFixture<UpdateDeleteButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateDeleteButtonsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateDeleteButtonsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
