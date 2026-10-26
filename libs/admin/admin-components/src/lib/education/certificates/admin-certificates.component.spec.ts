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
import { ICertificateCard } from '@portfolio-v2/state/dataModels';
import {
  certificatesSelector,
  nextCertificateIdSelector,
} from '@portfolio-v2/state/selectors';
import { AdminCertificatesComponent } from './admin-certificates.component';
import {
  CertificateWriteError,
  CertificateWriter,
} from './services/certificate-writer.service';

/** The certificates the page lists, newest first like the store. */
const certificates: ICertificateCard[] = [
  {
    id: 2,
    title: 'Game Development with Unity',
    completedDate: 'In progress',
    organization: 'Udemy',
    credentialID: 'None',
    certification: 'In Progress',
    certificateURL: '',
    description: 'A course about 2D game development.',
  },
  {
    id: 1,
    title: 'Neural Network and Deep Learning',
    completedDate: '08/09/2019',
    organization: 'Coursera',
    credentialID: 'R7P6PNDABS9V',
    certification: 'Here',
    certificateURL: 'https://www.coursera.org/account/accomplishments/certificate/R7P6PNDABS9V',
    description: 'An introductory course about deep learning.',
  },
];

/**
 * @param root element that contains the row buttons
 * @param name icon name
 * @param index which matching button, when the page lists several
 * @returns the row button
 */
function rowButton(root: ParentNode, name: string, index = 0): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].filter(
    (item) => item.textContent?.includes(name),
  )[index];

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

/**
 * @param id element id
 * @returns the field in the open dialog
 */
function dialogField(id: string): HTMLInputElement {
  const element = document.querySelector(`#${id}`);

  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`missing field ${id}`);
  }

  return element;
}

describe('AdminCertificatesComponent', () => {
  let fixture: ComponentFixture<AdminCertificatesComponent>;
  let component: AdminCertificatesComponent;
  let store: MockStore;
  let writer: jest.Mocked<CertificateWriter>;

  beforeEach(async () => {
    writer = createSpyObj(CertificateWriter);
    writer.save.mockResolvedValue(certificates[0]);
    writer.remove.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      imports: [AdminCertificatesComponent, NoopAnimationsModule],
      providers: [provideMockStore()],
    });

    TestBed.overrideComponent(AdminCertificatesComponent, {
      add: {
        providers: [{ provide: CertificateWriter, useValue: writer }],
      },
    });

    await TestBed.compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(certificatesSelector, certificates);
    store.overrideSelector(nextCertificateIdSelector, 3);
    store.refreshState();

    fixture = TestBed.createComponent(AdminCertificatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
    store.resetSelectors();
  });

  it('should load the certificates collection', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    component.ngOnInit();

    expect(dispatch).toHaveBeenCalledWith(StateActions.certificatesCardsStateConnect());
  });

  describe('when certificates are stored', () => {
    it('should list one card per certificate in store order', () => {
      const cards = fixture.nativeElement.querySelectorAll('.certificate-card');

      expect(cards).toHaveLength(2);
      expect(cards[0].textContent).toContain('Game Development with Unity');
      expect(cards[1].textContent).toContain('Neural Network and Deep Learning');
    });

    it('should show the details of a certificate', () => {
      const [, card] = fixture.nativeElement.querySelectorAll('.certificate-card');

      expect(card.textContent).toContain('Coursera');
      expect(card.textContent).toContain('Completed: 08/09/2019');
      expect(card.textContent).toContain('Credential ID: R7P6PNDABS9V');
      expect(card.textContent).toContain('Certificate: Here');
    });

    it('should lay the cards and the add tile out in one grid with the label under the button', () => {
      const grid: HTMLElement = fixture.nativeElement.querySelector('.certificate-grid');
      const add = grid.querySelector('.add-certificate');

      expect(add?.parentElement).toBe(grid);
      expect(add?.children[0].tagName).toBe('BUTTON');
      expect(add?.children[1].textContent?.trim()).toBe('Add');
    });
  });

  describe('when no certificates are stored', () => {
    beforeEach(() => {
      store.overrideSelector(certificatesSelector, undefined);
      store.refreshState();
      fixture.detectChanges();
    });

    it('should still offer the add control', () => {
      expect(fixture.nativeElement.querySelectorAll('.certificate-card')).toHaveLength(0);
      expect(fixture.nativeElement.querySelector('.add-certificate button')).not.toBeNull();
    });
  });

  describe('add', () => {
    it('should open an empty dialog from the add control', () => {
      fixture.nativeElement.querySelector('.add-certificate button').click();
      fixture.detectChanges();

      expect(document.body.textContent).toContain('New certificate');
      expect(dialogField('certificate-title').value).toBe('');
    });
  });

  describe('edit', () => {
    it('should open the dialog filled with that certificate', () => {
      rowButton(fixture.nativeElement, 'edit', 1).click();
      fixture.detectChanges();

      expect(document.body.textContent).toContain('Edit certificate');
      expect(dialogField('certificate-title').value).toBe('Neural Network and Deep Learning');
    });
  });

  describe('delete', () => {
    it('should delete only after the confirmation dialog accepts', async () => {
      rowButton(fixture.nativeElement, 'delete').click();
      fixture.detectChanges();

      expect(document.body.textContent).toContain('Delete certificate');
      expect(document.body.textContent).toContain('Game Development with Unity');
      expect(writer.remove).not.toHaveBeenCalled();

      dialogButton('Cancel').click();
      await fixture.whenStable();
      expect(writer.remove).not.toHaveBeenCalled();

      rowButton(fixture.nativeElement, 'delete').click();
      fixture.detectChanges();
      dialogButton('Delete').click();
      await fixture.whenStable();

      expect(writer.remove).toHaveBeenCalledWith(certificates[0]);
    });

    it('should keep the dialog open when the removal fails', async () => {
      writer.remove.mockRejectedValue(new CertificateWriteError('unauthenticated'));
      rowButton(fixture.nativeElement, 'delete').click();
      fixture.detectChanges();

      dialogButton('Delete').click();
      await fixture.whenStable();
      TestBed.inject(MatDialog).openDialogs[0].componentRef?.changeDetectorRef.detectChanges();

      expect(document.body.textContent).toContain('Sign in before changing certificates.');
      expect(writer.remove).toHaveBeenCalledTimes(1);
    });
  });
});
