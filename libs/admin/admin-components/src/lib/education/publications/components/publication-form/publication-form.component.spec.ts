import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { callComponentMethod } from '@portfolio-v2/shared/test-helpers';
import {
  type DraftFailure,
  type EditTarget,
  nextPublicationId,
  type Publication,
  type PublicationAsset,
  type PublicationDraft,
  type PublicationId,
} from '@portfolio-v2/state/dataModels';
import { PublicationFormComponent } from './publication-form.component';

/** Id the form is given for a new publication. */
const nextId = nextPublicationId(undefined, undefined);

/** A second id, used when the editor opens another record. */
const otherId = nextPublicationId([{ id: nextId }], undefined);

/** Cover already stored for an edited publication. */
const storedCover: PublicationAsset = {
  source: 'storage',
  url: 'storage://portfolio/publications/publication-card-images/ID-01-Image.webp',
};

/** Paper already stored for an edited publication. */
const storedPaper: PublicationAsset = {
  source: 'storage',
  url: 'storage://portfolio/publications/papers/ID-01-Paper.pdf',
};

/** A stored publication with no download. */
const stored: Publication = {
  id: nextId,
  title: 'ARWalker',
  detailTitle: 'ARWalker: A Virtual Walking Companion Application',
  keywords: 'keywords',
  summary: 'summary',
  authors: 'Authors',
  abstract: ['First paragraph.', 'Second paragraph.'],
  citation: 'citation',
  cover: storedCover,
  paper: null,
};

/** The same publication with a downloadable paper. */
const storedWithPaper: Publication = {
  ...stored,
  paper: {
    asset: storedPaper,
    fileName: 'ARWalker',
  },
};

/**
 * @param target event target
 * @returns a change event for that target
 */
function inputEvent(target: EventTarget): Event {
  return { target } as unknown as Event;
}

/**
 * @param files selected files, or null when the input has no file list
 * @returns a change event whose target is a file input
 */
function fileChange(files: readonly File[] | null): Event {
  const input = document.createElement('input');
  const list = files === null
    ? null
    : {
      0: files[0],
      length: files.length,
      item: (index: number) => files[index] ?? null,
    };

  Object.defineProperty(input, 'files', { value: list });

  return inputEvent(input);
}

/**
 * @param name file name
 * @param type mime type
 * @returns a change event for one selected file
 */
function fileEvent(name: string, type: string): Event {
  return fileChange([new File(['bytes'], name, { type })]);
}

/**
 * @param fixture form fixture
 * @param id element id
 * @returns the text field with that id
 */
function field(
  fixture: ComponentFixture<PublicationFormComponent>,
  id: string,
): HTMLInputElement | HTMLTextAreaElement {
  const element = fixture.nativeElement.querySelector(`#${id}`);

  if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) {
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
  fixture: ComponentFixture<PublicationFormComponent>,
  id: string,
  value: string,
): void {
  const element = field(fixture, id);
  element.value = value;
  element.dispatchEvent(new Event('input'));
}

/**
 * @param fixture form fixture
 * @param overrides fields that differ from a valid publication
 */
function fillText(
  fixture: ComponentFixture<PublicationFormComponent>,
  overrides: Partial<Record<string, string>> = {},
): void {
  const values: Record<string, string> = {
    'publication-title': 'Card',
    'publication-detail-title': 'Full title',
    'publication-keywords': 'keywords',
    'publication-summary': 'summary',
    'publication-authors': 'Authors',
    'publication-abstract': 'A paragraph.',
    'publication-citation': 'citation',
    ...overrides,
  };

  Object.entries(values).forEach(([id, value]) => setField(fixture, id, value));
  fixture.detectChanges();
}

describe('PublicationFormComponent', () => {
  let fixture: ComponentFixture<PublicationFormComponent>;
  let component: PublicationFormComponent;
  let emitted: PublicationDraft[];

  /**
   * @param target record the form edits
   */
  function openWith(target: EditTarget): void {
    fixture.componentRef.setInput('target', target);
    fixture.detectChanges();
  }

  /**
   * @param name file name
   * @param type mime type
   */
  function pickCover(name = 'cover.png', type = 'image/png'): void {
    component['onCoverSelected'](fileEvent(name, type));
    fixture.detectChanges();
  }

  /**
   * @param name file name
   * @param type mime type
   */
  function pickPaper(name = 'paper.pdf', type = 'application/pdf'): void {
    component['onPaperSelected'](fileEvent(name, type));
    fixture.detectChanges();
  }

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
    emitted = [];
    component.submitted.subscribe((draft) => emitted.push(draft));
    jest.mocked(URL.createObjectURL).mockClear();
    jest.mocked(URL.revokeObjectURL).mockClear();
  });

  describe('when adding a publication', () => {
    beforeEach(() => {
      openWith({ mode: 'new', id: nextId });
    });

    it('should start with empty fields and no cover preview', () => {
      expect(field(fixture, 'publication-title').value).toBe('');
      expect(field(fixture, 'publication-abstract').value).toBe('');
      expect(fixture.nativeElement.querySelector('.cover-preview')).toBeNull();
      expect(fixture.nativeElement.querySelector('#publication-file-name')).toBeNull();
    });

    it('should keep typed values when the same new publication stays open', () => {
      setField(fixture, 'publication-title', 'Draft title');

      openWith({ mode: 'new', id: nextId });

      expect(field(fixture, 'publication-title').value).toBe('Draft title');
    });

    it('should not emit and should show the required errors for an empty form', () => {
      component.submit();
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(emitted).toHaveLength(0);
      expect(text).toContain('A card title is required');
      expect(text).toContain('A detail title is required');
      expect(text).toContain('Keywords are required');
      expect(text).toContain('A summary is required');
      expect(text).toContain('Authors are required');
      expect(text).toContain('An abstract is required');
      expect(text).toContain('A citation is required');
      expect(text).toContain('A cover image is required');
    });

    it('should require a cover once the text fields are filled', () => {
      fillText(fixture);

      component.submit();
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
      expect(fixture.nativeElement.textContent).toContain('A cover image is required');
    });

    it('should reject a cover that is not an image', () => {
      fillText(fixture);
      pickCover('notes.pdf', 'application/pdf');

      component.submit();
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
      expect(fixture.nativeElement.textContent).toContain('The cover must be an image');
    });

    it('should preview a picked cover and replace the previous preview', () => {
      pickCover();
      pickCover('other.png', 'image/jpeg');

      expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:cover');
      expect(fixture.nativeElement.querySelector('.cover-preview').getAttribute('src'))
        .toBe('blob:cover');
    });

    it('should ignore a cover change that does not include a file', () => {
      pickCover();
      jest.mocked(URL.revokeObjectURL).mockClear();
      const emptyFileInput = document.createElement('input');
      emptyFileInput.type = 'file';

      component['onCoverSelected'](inputEvent(document.createElement('div')));
      component['onCoverSelected'](fileChange(null));
      component['onCoverSelected'](inputEvent(emptyFileInput));
      fixture.detectChanges();

      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('.cover-preview').getAttribute('src'))
        .toBe('blob:cover');
    });

    it('should emit a draft with the abstract split into paragraphs', () => {
      fillText(fixture, {
        'publication-abstract': 'First paragraph.\n\nSecond paragraph.',
      });
      pickCover();

      component.submit();

      expect(emitted).toEqual([{
        id: nextId,
        title: 'Card',
        detailTitle: 'Full title',
        keywords: 'keywords',
        summary: 'summary',
        authors: 'Authors',
        abstract: ['First paragraph.', 'Second paragraph.'],
        citation: 'citation',
        cover: expect.any(File),
        paper: null,
      }]);
    });

    it('should reject an abstract that has no paragraph', async () => {
      fillText(fixture, { 'publication-abstract': '  \n  \n  ' });
      pickCover();

      await component.submit();
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
      expect(fixture.nativeElement.textContent).toContain('The abstract needs at least one paragraph');
    });

    it('should name a paper from the title', () => {
      fillText(fixture, { 'publication-title': 'Hello, World!' });
      pickCover();
      pickPaper();

      component.submit();

      expect(field(fixture, 'publication-file-name').value).toBe('hello-world');
      expect(emitted[0].paper).toEqual({
        asset: expect.any(File),
        fileName: 'hello-world',
      });
    });

    it('should name the download paper when the title has no letters or digits', () => {
      fillText(fixture, { 'publication-title': '!!!' });
      pickPaper();

      expect(field(fixture, 'publication-file-name').value).toBe('paper');
    });

    it('should keep a download name the owner already typed', () => {
      fillText(fixture);
      pickPaper();
      setField(fixture, 'publication-file-name', 'custom-name');

      pickPaper('other.pdf', 'application/pdf');

      expect(field(fixture, 'publication-file-name').value).toBe('custom-name');
    });

    it('should ignore a paper change that does not include a file', () => {
      fillText(fixture);
      pickPaper();
      const emptyFileInput = document.createElement('input');
      emptyFileInput.type = 'file';

      component['onPaperSelected'](inputEvent(document.createElement('div')));
      component['onPaperSelected'](fileChange(null));
      component['onPaperSelected'](inputEvent(emptyFileInput));
      fixture.detectChanges();

      expect(field(fixture, 'publication-file-name').value).toBe('card');
    });

    it('should reject a paper that is not a pdf', () => {
      fillText(fixture);
      pickCover();
      pickPaper('notes.txt', 'text/plain');

      component.submit();
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
      expect(fixture.nativeElement.textContent).toContain('The paper must be a PDF');
    });

    it('should require a file name when the paper name is blank', () => {
      fillText(fixture);
      pickCover();
      pickPaper();
      setField(fixture, 'publication-file-name', '');

      component.submit();
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
      expect(fixture.nativeElement.textContent).toContain('A file name is required for the paper');
    });

    it('should reject a file name that is only whitespace', async () => {
      fillText(fixture);
      pickCover();
      pickPaper();
      setField(fixture, 'publication-file-name', '   ');

      await component.submit();
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
      expect(fixture.nativeElement.textContent).toContain('A file name is required for the paper');
    });

    it('should remove the paper and save without one', () => {
      fillText(fixture);
      pickCover();
      pickPaper();
      const button = fixture.nativeElement.querySelector('button');
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error('missing remove paper button');
      }

      button.click();
      fixture.detectChanges();
      component.submit();

      expect(fixture.nativeElement.querySelector('#publication-file-name')).toBeNull();
      expect(emitted[0].paper).toBeNull();
    });

    it('should show a form error when the publication id is not usable', () => {
      openWith({ mode: 'new', id: 0 as unknown as PublicationId });
      fillText(fixture);
      pickCover();

      component.submit();
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
      expect(fixture.nativeElement.querySelector('.form-error')?.textContent)
        .toContain('This publication cannot be saved.');
    });

    it('should release the object url for a picked cover', () => {
      pickCover();

      fixture.destroy();

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:cover');
    });

    it('should not revoke a url when no cover file was picked', () => {
      fixture.destroy();

      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    describe('when a save is in flight', () => {
      beforeEach(() => {
        fillText(fixture);
        pickCover();
        fixture.componentRef.setInput('disabled', true);
        fixture.detectChanges();
      });

      it('should lock the fields', () => {
        expect(field(fixture, 'publication-title').disabled).toBe(true);
      });

      it('should ignore a submit', () => {
        component.submit();

        expect(emitted).toHaveLength(0);
      });
    });

    describe('when a draft failure is mapped onto a field', () => {
      it.each<[DraftFailure, 'cover' | 'abstractText' | 'paper' | 'fileName']>([
        ['missing-cover', 'cover'],
        ['unsupported-cover', 'cover'],
        ['empty-abstract', 'abstractText'],
        ['unsupported-paper', 'paper'],
        ['missing-file-name', 'fileName'],
      ])('should attach %s to %s', (reason, fieldName) => {
        const formFields = component['editor'];
        const fields = {
          cover: formFields.cover,
          abstractText: formFields.abstractText,
          paper: formFields.paper,
          fileName: formFields.fileName,
        };
        const errors = callComponentMethod<{ kind: string; fieldTree: unknown }[] | undefined>(
          component,
          'draftError',
          reason,
        );

        expect(errors).toEqual([{
          fieldTree: fields[fieldName],
          kind: reason,
        }]);
      });

      it('should leave a form error when the failure has no field', () => {
        const errors = callComponentMethod<undefined>(component, 'draftError', 'invalid-id');

        expect(errors).toBeUndefined();
        expect(component['formError']()).toBe('This publication cannot be saved.');
      });
    });
  });

  describe('when editing a publication', () => {
    beforeEach(() => {
      openWith({ mode: 'edit', publication: stored });
    });

    it('should fill the editor from the publication being edited', () => {
      expect(field(fixture, 'publication-title').value).toBe('ARWalker');
      expect(field(fixture, 'publication-detail-title').value).toBe(stored.detailTitle);
      expect(field(fixture, 'publication-keywords').value).toBe('keywords');
      expect(field(fixture, 'publication-summary').value).toBe('summary');
      expect(field(fixture, 'publication-authors').value).toBe('Authors');
      expect(field(fixture, 'publication-abstract').value).toBe('First paragraph.\n\nSecond paragraph.');
      expect(field(fixture, 'publication-citation').value).toBe('citation');
      expect(fixture.nativeElement.querySelector('.cover-preview').getAttribute('src'))
        .toBe(storedCover.url);
      expect(fixture.nativeElement.querySelector('#publication-file-name')).toBeNull();
    });

    it('should emit the stored cover when the publication has no paper', () => {
      setField(fixture, 'publication-title', 'ARWalker revised');

      component.submit();

      expect(emitted).toEqual([{
        id: nextId,
        title: 'ARWalker revised',
        detailTitle: stored.detailTitle,
        keywords: 'keywords',
        summary: 'summary',
        authors: 'Authors',
        abstract: ['First paragraph.', 'Second paragraph.'],
        citation: 'citation',
        cover: storedCover,
        paper: null,
      }]);
    });

    it('should keep edits when the same publication stays open', () => {
      setField(fixture, 'publication-title', 'Changed');

      openWith({ mode: 'edit', publication: { ...stored } });

      expect(field(fixture, 'publication-title').value).toBe('Changed');
    });

    it('should refill the fields when another publication is opened', () => {
      openWith({
        mode: 'edit',
        publication: {
          ...stored,
          id: otherId,
          title: 'Other paper',
        },
      });

      expect(field(fixture, 'publication-title').value).toBe('Other paper');
    });

    it('should not revoke a url when destroyed before a new cover is picked', () => {
      fixture.destroy();

      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('when editing a publication that has a paper', () => {
    beforeEach(() => {
      openWith({ mode: 'edit', publication: storedWithPaper });
    });

    it('should fill the download name from the stored paper', () => {
      expect(field(fixture, 'publication-file-name').value).toBe('ARWalker');
    });

    it('should emit the stored paper', () => {
      setField(fixture, 'publication-file-name', 'revised-name');

      component.submit();

      expect(emitted[0].paper).toEqual({
        asset: storedPaper,
        fileName: 'revised-name',
      });
      expect(emitted[0].cover).toEqual(storedCover);
    });
  });
});
