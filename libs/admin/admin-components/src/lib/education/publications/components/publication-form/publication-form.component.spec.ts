import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { callComponentMethod } from '@portfolio-v2/shared/test-helpers';
import {
  EditTarget,
  nextPublicationId,
  PublicationDraft,
} from '@portfolio-v2/state/dataModels';
import { PublicationFormComponent } from './publication-form.component';

/**
 * @param fixture form fixture
 * @param id element id
 * @param value field value
 */
function setField(
  fixture: ComponentFixture<PublicationFormComponent>,
  id: string,
  value: string,
): void {
  const field = fixture.nativeElement.querySelector(`#${id}`);
  if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) {
    throw new Error(`missing field ${id}`);
  }

  field.value = value;
  field.dispatchEvent(new Event('input'));
}

/**
 * @param name file name
 * @param type mime type
 * @returns a change event whose target is a file input
 */
function fileEvent(name: string, type: string): Event {
  const file = new File(['bytes'], name, { type });
  const input = document.createElement('input');

  Object.defineProperty(input, 'files', {
    value: {
      0: file,
      length: 1,
      item: () => file,
    },
  });

  return { target: input } as Event;
}

describe('PublicationFormComponent', () => {
  let fixture: ComponentFixture<PublicationFormComponent>;
  let component: PublicationFormComponent;

  /** Id the form is given for a new publication. */
  const nextId = nextPublicationId(undefined, undefined);

  /** Target for a new publication. */
  const created: EditTarget = { mode: 'new', id: nextId };

  beforeAll(() => {
    URL.createObjectURL = jest.fn(() => 'blob:cover');
    URL.revokeObjectURL = jest.fn();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicationFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('target', created);
    fixture.detectChanges();
  });

  it('requires a cover before a new publication can be saved', () => {
    let emitted = false;
    component.submitted.subscribe(() => {
      emitted = true;
    });
    setField(fixture, 'publication-title', 'Card');
    setField(fixture, 'publication-detail-title', 'Full title');
    setField(fixture, 'publication-keywords', 'keywords');
    setField(fixture, 'publication-summary', 'summary');
    setField(fixture, 'publication-authors', 'Authors');
    setField(fixture, 'publication-abstract', 'A paragraph.');
    setField(fixture, 'publication-citation', 'citation');

    component.submit();
    fixture.detectChanges();

    expect(emitted).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('A cover image is required');
  });

  it('emits a draft with the abstract split into paragraphs', () => {
    const drafts: PublicationDraft[] = [];
    component.submitted.subscribe((draft) => drafts.push(draft));
    setField(fixture, 'publication-title', 'Card');
    setField(fixture, 'publication-detail-title', 'Full title');
    setField(fixture, 'publication-keywords', 'keywords');
    setField(fixture, 'publication-summary', 'summary');
    setField(fixture, 'publication-authors', 'Authors');
    setField(fixture, 'publication-abstract', 'First paragraph.\n\nSecond paragraph.');
    setField(fixture, 'publication-citation', 'citation');
    callComponentMethod(component, 'onCoverSelected', fileEvent('cover.png', 'image/png'));

    component.submit();

    expect(drafts).toHaveLength(1);
    expect(drafts[0].abstract).toEqual(['First paragraph.', 'Second paragraph.']);
    expect(drafts[0].title).toBe('Card');
    expect(drafts[0].cover).toEqual(expect.any(File));
    expect(drafts[0].paper).toBeNull();
  });

  it('rejects a cover that is not an image', () => {
    setField(fixture, 'publication-title', 'Card');
    setField(fixture, 'publication-detail-title', 'Full title');
    setField(fixture, 'publication-keywords', 'keywords');
    setField(fixture, 'publication-summary', 'summary');
    setField(fixture, 'publication-authors', 'Authors');
    setField(fixture, 'publication-abstract', 'A paragraph.');
    setField(fixture, 'publication-citation', 'citation');
    callComponentMethod(component, 'onCoverSelected', fileEvent('notes.pdf', 'application/pdf'));

    component.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('The cover must be an image');
  });

  it('fills the editor from the publication being edited', () => {
    fixture.componentRef.setInput('target', {
      mode: 'edit',
      publication: {
        id: nextId,
        title: 'ARWalker',
        detailTitle: 'ARWalker: A Virtual Walking Companion Application',
        keywords: 'keywords',
        summary: 'summary',
        authors: 'Authors',
        abstract: ['First paragraph.', 'Second paragraph.'],
        citation: 'citation',
        cover: { source: 'bundled', url: 'assets/images/publications/Researcher.jpeg' },
        paper: null,
      },
    });
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('#publication-title');
    const abstract = fixture.nativeElement.querySelector('#publication-abstract');
    expect(title.value).toBe('ARWalker');
    expect(abstract.value).toBe('First paragraph.\n\nSecond paragraph.');
    expect(fixture.nativeElement.querySelector('.cover-preview').getAttribute('src'))
      .toBe('assets/images/publications/Researcher.jpeg');
  });
});
