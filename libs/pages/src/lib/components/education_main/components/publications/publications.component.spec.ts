import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';

import {
  StateActions,
  StoreState,
} from '@portfolio-v2/state';
import {
  IPublication,
  IPublicationDetails,
} from '@portfolio-v2/state/dataModels';
import { PublicationsComponent } from './publications.component';

/** Store slice the publication selectors read. */
function stateBanks(
  publications: IPublication[] | undefined,
  details: IPublicationDetails[],
): { stateBanks: StoreState } {
  return {
    stateBanks: {
      selectedProjectCardID: 0,
      selectedPublicationID: 1,
      isAdmin: false,
      isPreviewMode: false,
      isPartyMode: false,
      publications,
      publicationDetails: details,
    },
  };
}

const publication: IPublication = {
  id: 1,
  title: 'ARWalker',
  subTitle: 'Gait Rehabilitation',
  imageUrl: 'assets/images/publications/arwalker.webp',
  shortDesc: 'A short summary of the paper.',
  btnMoreDisable: false,
  btnDownloadDisable: false,
  downloadUrl: 'assets/papers/ARWalker.pdf',
  downloadFileName: 'ARWalker',
};

const detail: IPublicationDetails = {
  id: 1,
  title: 'ARWalker: A Virtual Walking Companion Application',
  authors: 'Pubudu Wijesooriya',
  abstarct: ['First paragraph.', 'Second paragraph.'],
  citation: 'Wijesooriya, 2023.',
};

/**
 * @param root element that contains the anchors
 * @param name visible label
 * @returns the matching anchor
 */
function actionLink(root: ParentNode, name: string): HTMLAnchorElement {
  const link = [...root.querySelectorAll('a')].find(
    (item) => item.textContent?.includes(name),
  );

  if (!(link instanceof HTMLAnchorElement)) {
    throw new Error(`missing ${name} link`);
  }

  return link;
}

describe('PublicationsComponent', () => {
  let fixture: ComponentFixture<PublicationsComponent>;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationsComponent, NoopAnimationsModule],
      providers: [provideMockStore({ initialState: stateBanks([publication], [detail]) })],
    }).compileComponents();

    store = TestBed.inject(MockStore);

    fixture = TestBed.createComponent(PublicationsComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
  });

  describe('when publications are stored', () => {
    it('should list the title, keywords, summary, and cover', () => {
      const card: HTMLElement = fixture.nativeElement.querySelector('.publication-card');
      const image = card.querySelector('img');

      expect(card.textContent).toContain('ARWalker');
      expect(card.textContent).toContain('Gait Rehabilitation');
      expect(card.textContent).toContain('A short summary of the paper.');
      expect(image?.getAttribute('src')).toBe(publication.imageUrl);
      expect(image?.getAttribute('alt')).toBe('Publication Photo');
    });

    it('should offer a download for the paper', () => {
      const download = actionLink(fixture.nativeElement, 'Download');

      expect(download.getAttribute('href')).toBe(publication.downloadUrl);
      expect(download.getAttribute('download')).toBe('ARWalker');
    });

    it('should open the detail dialog for that publication', () => {
      const dispatch = jest.spyOn(store, 'dispatch');

      actionLink(fixture.nativeElement, 'More').click();
      fixture.detectChanges();

      expect(dispatch).toHaveBeenCalledWith(
        StateActions.selectedPublicationCardIDStateUpdated({ selectedPublicationID: 1 }),
      );
      expect(document.body.textContent).toContain('ARWalker: A Virtual Walking Companion Application');
      expect(document.body.textContent).toContain('Authors:');
      expect(document.body.textContent).toContain('Pubudu Wijesooriya');
      expect(document.body.textContent).toContain('Abstract:');
      expect(document.body.textContent).toContain('Second paragraph.');
      expect(document.body.textContent).toContain('Cite:');
      expect(document.body.textContent).toContain('Wijesooriya, 2023.');
    });
  });

  describe('when a publication has no paper', () => {
    beforeEach(() => {
      store.setState(stateBanks([{
        ...publication,
        btnDownloadDisable: true,
        downloadUrl: undefined,
        downloadFileName: '',
      }], [detail]));
      fixture.detectChanges();
    });

    it('should leave the download without a file', () => {
      const download = actionLink(fixture.nativeElement, 'Download');

      expect(download.getAttribute('href')).toBe('');
      expect(download.getAttribute('download')).toBe('');
    });
  });

  describe('when no publications are stored', () => {
    beforeEach(() => {
      store.setState(stateBanks(undefined, []));
      fixture.detectChanges();
    });

    it('should show the heading without cards', () => {
      expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain('Publications');
      expect(fixture.nativeElement.querySelector('.publication-card')).toBeNull();
    });
  });
});
