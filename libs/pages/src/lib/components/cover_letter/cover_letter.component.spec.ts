import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { CoverLetterComponent } from './cover_letter.component';

describe('CoverLetterComponent', () => {
  let component: CoverLetterComponent;
  let fixture: ComponentFixture<CoverLetterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoverLetterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CoverLetterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
