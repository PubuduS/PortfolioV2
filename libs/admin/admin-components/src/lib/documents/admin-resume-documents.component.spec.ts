import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';

import { AdminDocumentsComponent } from './admin-documents.component';
import { AdminResumeDocumentsComponent } from './admin-resume-documents.component';

describe('AdminResumeDocumentsComponent', () => {
  let fixture: ComponentFixture<AdminResumeDocumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminResumeDocumentsComponent],
    }).overrideComponent(AdminResumeDocumentsComponent, {
      set: { imports: [MockComponent(AdminDocumentsComponent)] },
    }).compileComponents();

    fixture = TestBed.createComponent(AdminResumeDocumentsComponent);
    fixture.detectChanges();
  });

  it('should host the documents editor', () => {
    expect(fixture.nativeElement.querySelector('admin-documents')).not.toBeNull();
  });
});
