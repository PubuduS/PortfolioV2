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
import { IEducation } from '@portfolio-v2/state/dataModels';
import {
  educationSelector,
  nextEducationIdSelector,
} from '@portfolio-v2/state/selectors';
import { AdminDegreesComponent } from './admin-degrees.component';
import {
  DegreeWriteError,
  DegreeWriter,
} from './services/degree-writer.service';

/** The degrees the page lists, newest first like the store. */
const degrees: IEducation[] = [
  {
    id: 2,
    title: 'South Dakota State University',
    period: '2016 - 2019',
    degree: 'BACHELOR OF SCIENCE (BSc) IN COMPUTER SCIENCE',
    gpa: '3.537',
    awards: 'Spring 2019',
    credits: '149/120',
    graduated: '04th of May 2019',
    extra: '',
  },
  {
    id: 1,
    title: 'American College of Higher Education',
    period: '2014 - 2016',
    degree: 'ASSOCIATE DEGREE IN COMPUTER SCIENCE',
    gpa: '3.84',
    awards: 'Fall 2014, Spring 2015',
    credits: '79/60',
    graduated: 'Transferred in Fall 2016',
    extra: 'Summer 2015',
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

describe('AdminDegreesComponent', () => {
  let fixture: ComponentFixture<AdminDegreesComponent>;
  let component: AdminDegreesComponent;
  let store: MockStore;
  let writer: jest.Mocked<DegreeWriter>;

  beforeEach(async () => {
    writer = createSpyObj(DegreeWriter);
    writer.save.mockResolvedValue(degrees[0]);
    writer.remove.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      imports: [AdminDegreesComponent, NoopAnimationsModule],
      providers: [provideMockStore()],
    });

    TestBed.overrideComponent(AdminDegreesComponent, {
      add: {
        providers: [{ provide: DegreeWriter, useValue: writer }],
      },
    });

    await TestBed.compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(educationSelector, degrees);
    store.overrideSelector(nextEducationIdSelector, 3);
    store.refreshState();

    fixture = TestBed.createComponent(AdminDegreesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
    store.resetSelectors();
  });

  it('should load the education collection', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    component.ngOnInit();

    expect(dispatch).toHaveBeenCalledWith(StateActions.educationCardsStateConnect());
  });

  describe('when degrees are stored', () => {
    it('should list one card per degree in store order', () => {
      const cards = fixture.nativeElement.querySelectorAll('.degree-card');

      expect(cards).toHaveLength(2);
      expect(cards[0].textContent).toContain('South Dakota State University');
      expect(cards[1].textContent).toContain('American College of Higher Education');
    });

    it('should show the details of a degree', () => {
      const [, card] = fixture.nativeElement.querySelectorAll('.degree-card');

      expect(card.textContent).toContain('2014 - 2016');
      expect(card.textContent).toContain('ASSOCIATE DEGREE IN COMPUTER SCIENCE');
      expect(card.textContent).toContain('GPA: 3.84');
      expect(card.textContent).toContain('Awarded: Fall 2014, Spring 2015');
      expect(card.textContent).toContain('Honors: Summer 2015');
      expect(card.textContent).toContain('Credits: 79/60');
      expect(card.textContent).toContain('Graduated: Transferred in Fall 2016');
    });

    it('should leave out the honors row when the degree has none', () => {
      const [card] = fixture.nativeElement.querySelectorAll('.degree-card');

      expect(card.textContent).not.toContain('Honors:');
    });

    it('should lay the cards and the add tile out in one grid with the label under the button', () => {
      const grid: HTMLElement = fixture.nativeElement.querySelector('.degree-grid');
      const add = grid.querySelector('.add-degree');

      expect(add?.parentElement).toBe(grid);
      expect(add?.children[0].tagName).toBe('BUTTON');
      expect(add?.children[1].textContent?.trim()).toBe('Add');
    });
  });

  describe('when no degrees are stored', () => {
    beforeEach(() => {
      store.overrideSelector(educationSelector, undefined);
      store.refreshState();
      fixture.detectChanges();
    });

    it('should still offer the add control', () => {
      expect(fixture.nativeElement.querySelectorAll('.degree-card')).toHaveLength(0);
      expect(fixture.nativeElement.querySelector('.add-degree button')).not.toBeNull();
    });
  });

  describe('add', () => {
    it('should open an empty dialog from the add control', () => {
      fixture.nativeElement.querySelector('.add-degree button').click();
      fixture.detectChanges();

      expect(document.body.textContent).toContain('New degree');
      expect(dialogField('degree-title').value).toBe('');
    });
  });

  describe('edit', () => {
    it('should open the dialog filled with that degree', () => {
      rowButton(fixture.nativeElement, 'edit', 1).click();
      fixture.detectChanges();

      expect(document.body.textContent).toContain('Edit degree');
      expect(dialogField('degree-title').value).toBe('American College of Higher Education');
    });
  });

  describe('delete', () => {
    it('should delete only after the confirmation dialog accepts', async () => {
      rowButton(fixture.nativeElement, 'delete').click();
      fixture.detectChanges();

      expect(document.body.textContent).toContain('Delete degree');
      expect(document.body.textContent).toContain('South Dakota State University');
      expect(writer.remove).not.toHaveBeenCalled();

      dialogButton('Cancel').click();
      await fixture.whenStable();
      expect(writer.remove).not.toHaveBeenCalled();

      rowButton(fixture.nativeElement, 'delete').click();
      fixture.detectChanges();
      dialogButton('Delete').click();
      await fixture.whenStable();

      expect(writer.remove).toHaveBeenCalledWith(degrees[0]);
    });

    it('should keep the dialog open when the removal fails', async () => {
      writer.remove.mockRejectedValue(new DegreeWriteError('unauthenticated'));
      rowButton(fixture.nativeElement, 'delete').click();
      fixture.detectChanges();

      dialogButton('Delete').click();
      await fixture.whenStable();
      TestBed.inject(MatDialog).openDialogs[0].componentRef?.changeDetectorRef.detectChanges();

      expect(document.body.textContent).toContain('Sign in before changing degrees.');
      expect(writer.remove).toHaveBeenCalledTimes(1);
    });
  });
});
