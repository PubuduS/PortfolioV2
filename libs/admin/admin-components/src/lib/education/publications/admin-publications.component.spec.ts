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
import { createSpyObj } from 'jest-createspyobj';

import { StateActions } from '@portfolio-v2/state';
import {
  IPublication,
  IPublicationDetails,
  joinPublications,
  nextPublicationId,
} from '@portfolio-v2/state/dataModels';
import {
  nextPublicationRecordIdSelector,
  publicationRecordsSelector,
} from '@portfolio-v2/state/selectors';
import { AdminPublicationsComponent } from './admin-publications.component';
import {
  PublicationWriteError,
  PublicationWriter,
} from './services/publication-writer.service';

/** Card document of the publication under test. */
const card: IPublication = {
  id: 1,
  title: 'ARWalker',
  subTitle: 'keywords',
  imageUrl: 'storage://portfolio/publications/publication-card-images/ID-01-Image.webp',
  shortDesc: 'summary',
  btnMoreDisable: false,
  btnDownloadDisable: false,
  downloadUrl: 'storage://portfolio/publications/papers/ID-01-Paper.pdf',
  downloadFileName: 'ARWalker',
};

/** Details document of the publication under test. */
const detail: IPublicationDetails = {
  id: 1,
  title: 'ARWalker: A Virtual Walking Companion Application',
  authors: 'Authors',
  abstarct: ['A paragraph.'],
  citation: 'citation',
};

/** The joined records the page lists. */
const publications = joinPublications([card], [detail]);

/**
 * @param root element that contains the row buttons
 * @param name icon name
 * @returns the row button
 */
function rowButton(root: ParentNode, name: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (item) => item.textContent?.includes(name),
  );

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`missing ${name} button`);
  }

  return button;
}

/**
 * @param label button label
 * @returns the button in the open dialog
 */
function dialogButton(label: string): HTMLButtonElement {
  const button = [...document.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === label,
  );

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`missing ${label} button`);
  }

  return button;
}

describe('AdminPublicationsComponent', () => {
  let fixture: ComponentFixture<AdminPublicationsComponent>;
  let component: AdminPublicationsComponent;
  let store: MockStore;
  let writer: jest.Mocked<PublicationWriter>;

  beforeEach(async () => {
    writer = createSpyObj(PublicationWriter);
    writer.save.mockResolvedValue(publications[0]);
    writer.remove.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      imports: [AdminPublicationsComponent, NoopAnimationsModule],
      providers: [provideMockStore()],
    });

    TestBed.overrideComponent(AdminPublicationsComponent, {
      add: {
        providers: [{ provide: PublicationWriter, useValue: writer }],
      },
    });

    await TestBed.compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(publicationRecordsSelector, publications);
    store.overrideSelector(
      nextPublicationRecordIdSelector,
      nextPublicationId(undefined, undefined),
    );
    store.refreshState();

    fixture = TestBed.createComponent(AdminPublicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
  });

  it('loads both publication collections', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    component.ngOnInit();

    expect(dispatch).toHaveBeenCalledWith(StateActions.publicationCardsStateConnect());
    expect(dispatch).toHaveBeenCalledWith(StateActions.publicationDetailCardsStateConnect());
  });

  it('shows the card and opens an empty dialog from the add control', () => {
    expect(fixture.nativeElement.textContent).toContain('ARWalker');

    fixture.nativeElement.querySelector('.add-publication button').click();
    fixture.detectChanges();

    expect(document.body.textContent).toContain('New publication');
    const title = document.querySelector('#publication-title');
    expect(title).toBeInstanceOf(HTMLInputElement);
    expect((title as HTMLInputElement).value).toBe('');
  });

  it('lays the cards and the add tile out in one grid with the label under the button', () => {
    const grid: HTMLElement = fixture.nativeElement.querySelector('.publication-grid');
    const add = grid.querySelector('.add-publication');

    expect(grid.querySelectorAll('.publication-card')).toHaveLength(1);
    expect(add?.parentElement).toBe(grid);
    expect(add?.children[0].tagName).toBe('BUTTON');
    expect(add?.children[1].textContent?.trim()).toBe('Add');
  });

  it('opens the edit dialog filled with that publication', () => {
    rowButton(fixture.nativeElement, 'edit').click();
    fixture.detectChanges();

    expect(document.body.textContent).toContain('Edit publication');
    const title = document.querySelector('#publication-title');
    expect(title).toBeInstanceOf(HTMLInputElement);
    expect((title as HTMLInputElement).value).toBe('ARWalker');
  });

  it('deletes only after the confirmation dialog accepts', async () => {
    rowButton(fixture.nativeElement, 'delete').click();
    fixture.detectChanges();

    expect(document.body.textContent).toContain('Delete publication');
    expect(document.body.textContent).toContain('ARWalker');
    expect(writer.remove).not.toHaveBeenCalled();

    dialogButton('Cancel').click();
    await fixture.whenStable();
    expect(writer.remove).not.toHaveBeenCalled();

    rowButton(fixture.nativeElement, 'delete').click();
    fixture.detectChanges();
    dialogButton('Delete').click();
    await fixture.whenStable();

    expect(writer.remove).toHaveBeenCalledWith(publications[0]);
  });

  it('keeps the delete dialog open when the removal fails', async () => {
    writer.remove.mockRejectedValue(new PublicationWriteError('unauthenticated'));
    rowButton(fixture.nativeElement, 'delete').click();
    fixture.detectChanges();

    dialogButton('Delete').click();
    await fixture.whenStable();
    TestBed.inject(MatDialog).openDialogs[0].componentRef?.changeDetectorRef.detectChanges();

    expect(document.body.textContent).toContain('Sign in before changing publications.');
    expect(writer.remove).toHaveBeenCalledTimes(1);
  });
});
