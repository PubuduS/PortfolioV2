import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';

import { StoreState } from '@portfolio-v2/state';
import { IPublicationDetails } from '@portfolio-v2/state/dataModels';
import { PublicationDetailComponent } from './publication_detail.component';

/**
 * @param selectedPublicationID id the dialog reads when it is created
 * @param details stored detail records
 * @returns a mock root state
 */
function stateBanks(
  selectedPublicationID: number,
  details: IPublicationDetails[],
): { stateBanks: StoreState } {
  return {
    stateBanks: {
      selectedProjectCardID: 0,
      selectedPublicationID,
      isAdmin: false,
      isPreviewMode: false,
      isPartyMode: false,
      publicationDetails: details,
    },
  };
}

const detail: IPublicationDetails = {
  id: 2,
  title: 'A Study of the Hololens Application Store',
  authors: 'Pubudu Wijesooriya',
  abstarct: ['The store holds many applications.'],
  citation: 'Wijesooriya, 2022.',
};

describe('PublicationDetailComponent', () => {
  let fixture: ComponentFixture<PublicationDetailComponent>;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationDetailComponent],
      providers: [provideMockStore({ initialState: stateBanks(detail.id, [detail]) })],
    }).compileComponents();

    store = TestBed.inject(MockStore);

    fixture = TestBed.createComponent(PublicationDetailComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    store.setState(stateBanks(detail.id, [detail]));
  });

  describe('when a publication is selected', () => {
    it('should show the title, authors, abstract, citation, and copy control', () => {
      const text = fixture.nativeElement.textContent;

      expect(fixture.nativeElement.querySelector('#title')?.textContent).toContain(detail.title);
      expect(text).toContain('Authors:');
      expect(text).toContain(detail.authors);
      expect(text).toContain('Abstract:');
      expect(text).toContain(detail.abstarct[0]);
      expect(text).toContain('Cite:');
      expect(text).toContain(detail.citation);
      expect(fixture.nativeElement.querySelector('button')?.textContent).toContain('Copy');
    });
  });

  describe('when the selected publication has no details', () => {
    beforeEach(() => {
      store.setState(stateBanks(99, [detail]));
      fixture = TestBed.createComponent(PublicationDetailComponent);
      fixture.detectChanges();
    });

    it('should leave the dialog body empty', () => {
      expect(fixture.nativeElement.querySelector('#title')).toBeNull();
      expect(fixture.nativeElement.textContent?.trim()).toBe('');
    });
  });
});
