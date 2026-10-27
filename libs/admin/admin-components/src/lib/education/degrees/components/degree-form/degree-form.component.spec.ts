import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import {
  EducationEditTarget,
  IEducation,
} from '@portfolio-v2/state/dataModels';
import { DegreeFormComponent } from './degree-form.component';

/** A stored record with an extra. */
const stored: IEducation = {
  id: 2,
  title: 'South Dakota State University',
  period: '2016 - 2019',
  degree: 'BACHELOR OF SCIENCE (BSc) IN COMPUTER SCIENCE',
  gpa: '3.537',
  awards: 'Spring 2019',
  credits: '149/120',
  graduated: '04th of May 2019',
  extra: 'Summa cum laude',
};

/**
 * @param fixture form fixture
 * @param id element id
 * @returns the field with that id
 */
function field(
  fixture: ComponentFixture<DegreeFormComponent>,
  id: string,
): HTMLInputElement {
  const element = fixture.nativeElement.querySelector(`#${id}`);

  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`missing field ${id}`);
  }

  return element;
}

/**
 * @param fixture form fixture
 * @param id element id
 * @param value field value
 */
function setField(
  fixture: ComponentFixture<DegreeFormComponent>,
  id: string,
  value: string,
): void {
  const element = field(fixture, id);
  element.value = value;
  element.dispatchEvent(new Event('input'));
}

/**
 * @param fixture form fixture
 * @param overrides fields that differ from a valid record
 */
function fillForm(
  fixture: ComponentFixture<DegreeFormComponent>,
  overrides: Partial<Record<string, string>> = {},
): void {
  const values: Record<string, string> = {
    'degree-title': 'Example University',
    'degree-name': 'MASTER OF SCIENCE (MSc) IN COMPUTER SCIENCE',
    'degree-period': '2021 - 2023',
    'degree-gpa': '3.952',
    'degree-awards': 'GRACA grant',
    'degree-extra': '',
    'degree-credits': '30/30',
    'degree-graduated': '19th of May 2023',
    ...overrides,
  };

  Object.entries(values).forEach(([id, value]) => setField(fixture, id, value));
  fixture.detectChanges();
}

describe('DegreeFormComponent', () => {
  let fixture: ComponentFixture<DegreeFormComponent>;
  let component: DegreeFormComponent;
  let emitted: IEducation[];

  /**
   * @param target record the form edits
   */
  function openWith(target: EducationEditTarget): void {
    fixture.componentRef.setInput('target', target);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DegreeFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DegreeFormComponent);
    component = fixture.componentInstance;
    emitted = [];
    component.submitted.subscribe((degree) => emitted.push(degree));
  });

  describe('when adding a degree', () => {
    beforeEach(() => {
      openWith({ mode: 'new', id: 4 });
    });

    it('should start with empty fields', () => {
      expect(field(fixture, 'degree-title').value).toBe('');
      expect(field(fixture, 'degree-extra').value).toBe('');
    });

    it('should not show the full-width tile hint', () => {
      expect(fixture.nativeElement.querySelector('.form-hint')).toBeNull();
    });

    it('should emit the record with the id the editor opened with', () => {
      fillForm(fixture);

      component.submit();

      expect(emitted).toEqual([{
        id: 4,
        title: 'Example University',
        degree: 'MASTER OF SCIENCE (MSc) IN COMPUTER SCIENCE',
        period: '2021 - 2023',
        gpa: '3.952',
        awards: 'GRACA grant',
        credits: '30/30',
        graduated: '19th of May 2023',
        extra: '',
      }]);
    });

    it('should keep the optional honors when they are filled in', () => {
      fillForm(fixture, { 'degree-extra': 'Dean\'s list' });

      component.submit();

      expect(emitted[0].extra).toBe('Dean\'s list');
    });

    it('should not emit and should show the required errors for an empty form', () => {
      component.submit();
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(emitted).toHaveLength(0);
      expect(text).toContain('An institute name is required');
      expect(text).toContain('A degree name is required');
      expect(text).toContain('A period is required');
      expect(text).toContain('A GPA is required');
      expect(text).toContain('An award is required');
      expect(text).toContain('Credits are required');
      expect(text).toContain('A graduation date is required');
    });

    it('should show the generic failure when a field holds only spaces', () => {
      fillForm(fixture, { 'degree-gpa': '   ' });

      component.submit();
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
      expect(fixture.nativeElement.querySelector('.form-error')?.textContent)
        .toContain('This degree cannot be saved.');
    });

    describe('when a save is in flight', () => {
      beforeEach(() => {
        fillForm(fixture);
        fixture.componentRef.setInput('disabled', true);
        fixture.detectChanges();
      });

      it('should lock the fields', () => {
        expect(field(fixture, 'degree-title').disabled).toBe(true);
      });

      it('should ignore a submit', () => {
        component.submit();

        expect(emitted).toHaveLength(0);
      });
    });
  });

  describe('when editing a degree', () => {
    beforeEach(() => {
      openWith({ mode: 'edit', education: stored });
    });

    it('should fill the fields from the record', () => {
      expect(field(fixture, 'degree-title').value).toBe('South Dakota State University');
      expect(field(fixture, 'degree-name').value).toBe(stored.degree);
      expect(field(fixture, 'degree-period').value).toBe('2016 - 2019');
      expect(field(fixture, 'degree-gpa').value).toBe('3.537');
      expect(field(fixture, 'degree-awards').value).toBe('Spring 2019');
      expect(field(fixture, 'degree-extra').value).toBe('Summa cum laude');
      expect(field(fixture, 'degree-credits').value).toBe('149/120');
      expect(field(fixture, 'degree-graduated').value).toBe('04th of May 2019');
    });

    it('should emit the same id with the edited values', () => {
      setField(fixture, 'degree-gpa', '3.6');

      component.submit();

      expect(emitted).toEqual([{ ...stored, gpa: '3.6' }]);
    });

    it('should show a missing extra as blank and write it back as an empty string', () => {
      const withoutExtra: IEducation = { ...stored, id: 3 };
      delete withoutExtra.extra;
      openWith({ mode: 'edit', education: withoutExtra });

      expect(field(fixture, 'degree-extra').value).toBe('');

      component.submit();

      expect(emitted[0]).toMatchObject({ id: 3, extra: '' });
    });

    it('should refill the fields when another record is opened', () => {
      openWith({ mode: 'edit', education: { ...stored, id: 5, title: 'Another' } });

      expect(field(fixture, 'degree-title').value).toBe('Another');
    });
  });

  describe('when editing the full-width record', () => {
    it('should explain how the public page labels it', () => {
      openWith({ mode: 'edit', education: { ...stored, id: 1 } });

      expect(fixture.nativeElement.querySelector('.form-hint')?.textContent)
        .toContain('Dean\'s List');
    });
  });
});
