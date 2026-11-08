import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';

import { AdminCoverLetterDocumentsComponent } from './admin-cover-letter-documents.component';
import { AdminDocumentsComponent } from './admin-documents.component';

describe('AdminCoverLetterDocumentsComponent', () => {
  let fixture: ComponentFixture<AdminCoverLetterDocumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCoverLetterDocumentsComponent],
    }).overrideComponent(AdminCoverLetterDocumentsComponent, {
      set: { imports: [MockComponent(AdminDocumentsComponent)] },
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCoverLetterDocumentsComponent);
    fixture.detectChanges();
  });

  it('should host the documents editor', () => {
    expect(fixture.nativeElement.querySelector('admin-documents')).not.toBeNull();
  });
});
