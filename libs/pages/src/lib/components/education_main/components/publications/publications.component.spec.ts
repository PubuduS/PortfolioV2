import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';

import { publicationCardsSelector } from '@portfolio-v2/state/selectors';
import { IPublication } from '@portfolio-v2/state/dataModels';
import { PublicationsComponent } from './publications.component';

describe('PublicationsComponent', () => {
  let component: PublicationsComponent;
  let fixture: ComponentFixture<PublicationsComponent>;
  let store: MockStore;
  const mockData: IPublication[] = [{
    id: 1,
    title: 'some title',
    subTitle: 'some sub title',
    imageUrl: 'some image url',
    shortDesc: 'some short description',
    btnMoreDisable: false,
    btnDownloadDisable: false,
    downloadUrl: 'some download URL',
    downloadFileName: 'download file name',
  }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationsComponent],
      providers: [
        provideMockStore(),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(publicationCardsSelector, mockData);
    fixture = TestBed.createComponent(PublicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
