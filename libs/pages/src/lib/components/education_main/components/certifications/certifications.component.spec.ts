import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';

import { certificatesSelector } from '@portfolio-v2/state/selectors';
import { ICertificateCard } from '@portfolio-v2/state/dataModels';
import { CertificationsComponent } from './certifications.component';

describe('CertificationsComponent', () => {
  let component: CertificationsComponent;
  let fixture: ComponentFixture<CertificationsComponent>;
  let store: MockStore;
  const mockData: ICertificateCard[] = [{
    id: 1,
    title: 'some title',
    completedDate: '05/05/2016',
    organization: 'some organization',
    credentialID: 'some id',
    certification: 'Here',
    certificateURL: 'some url',
    description: 'some description',
  }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificationsComponent],
      providers: [
        provideMockStore(),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(certificatesSelector, mockData);
    fixture = TestBed.createComponent(CertificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
