import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import {
  CertificateEditTarget,
  ICertificateCard,
} from '@portfolio-v2/state/dataModels';
import { CertificateFormComponent } from './certificate-form.component';

/** A stored, earned certificate. */
const stored: ICertificateCard = {
  id: 7,
  title: 'Angular Level 1 Certification',
  completedDate: '02/21/2024',
  organization: 'Angular Training',
  credentialID: '5A20CF0',
  certification: 'Here',
  certificateURL: 'https://interstate21.com/certificate/?code=5A20CF0',
  description: 'A professional certification.',
};

/**
 * @param fixture form fixture
 * @param id element id
 * @returns the field with that id
 */
function field(
  fixture: ComponentFixture<CertificateFormComponent>,
  id: string,
): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  const element = fixture.nativeElement.querySelector(`#${id}`);

  if (
    !(element instanceof HTMLInputElement)
    && !(element instanceof HTMLTextAreaElement)
    && !(element instanceof HTMLSelectElement)
  ) {
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
  fixture: ComponentFixture<CertificateFormComponent>,
  id: string,
  value: string,
): void {
  const element = field(fixture, id);
  element.value = value;
  element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input'));
}

/**
 * @param fixture form fixture
 * @param overrides fields that differ from a valid earned certificate
 */
function fillForm(
  fixture: ComponentFixture<CertificateFormComponent>,
  overrides: Partial<Record<string, string>> = {},
): void {
  const values: Record<string, string> = {
    'certificate-title': 'New certificate',
    'certificate-organization': 'Coursera',
    'certificate-status': 'Here',
    'certificate-completed-date': '01/02/2025',
    'certificate-credential-id': 'XYZ',
    'certificate-url': 'https://example.com/certificate',
    'certificate-description': 'A description.',
    ...overrides,
  };

  Object.entries(values).forEach(([id, value]) => setField(fixture, id, value));
  fixture.detectChanges();
}

describe('CertificateFormComponent', () => {
  let fixture: ComponentFixture<CertificateFormComponent>;
  let component: CertificateFormComponent;
  let emitted: ICertificateCard[];

  /**
   * @param target record the form edits
   */
  function openWith(target: CertificateEditTarget): void {
    fixture.componentRef.setInput('target', target);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificateFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CertificateFormComponent);
    component = fixture.componentInstance;
    emitted = [];
    component.submitted.subscribe((certificate) => emitted.push(certificate));
  });

  describe('when adding a certificate', () => {
    beforeEach(() => {
      openWith({ mode: 'new', id: 8 });
    });

    it('should start with empty fields and the earned status', () => {
      expect(field(fixture, 'certificate-title').value).toBe('');
      expect(field(fixture, 'certificate-status').value).toBe('Here');
    });

    it('should emit the record with the id the editor opened with', () => {
      fillForm(fixture);

      component.submit();

      expect(emitted).toEqual([{
        id: 8,
        title: 'New certificate',
        organization: 'Coursera',
        completedDate: '01/02/2025',
        credentialID: 'XYZ',
        certification: 'Here',
        certificateURL: 'https://example.com/certificate',
        description: 'A description.',
      }]);
    });

    it('should store None when the credential id is left blank', () => {
      fillForm(fixture, { 'certificate-credential-id': '' });

      component.submit();

      expect(emitted[0].credentialID).toBe('None');
    });

    it('should not emit and should show the required errors for an empty form', () => {
      component.submit();
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(emitted).toHaveLength(0);
      expect(text).toContain('A title is required');
      expect(text).toContain('An issuing organization is required');
      expect(text).toContain('A completion date or an in-progress label is required');
      expect(text).toContain('A description is required');
    });

    it('should require a link while the certificate is earned', () => {
      fillForm(fixture, { 'certificate-url': '' });

      component.submit();
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
      expect(fixture.nativeElement.textContent)
        .toContain('A link is required once the certificate is available');
    });

    it('should reject a link that is not a web url', () => {
      fillForm(fixture, { 'certificate-url': 'not a link' });

      component.submit();
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
      expect(fixture.nativeElement.textContent).toContain('Enter a valid http or https link');
    });

    describe('when the status changes to in progress', () => {
      beforeEach(() => {
        fillForm(fixture, {
          'certificate-status': 'In Progress',
          'certificate-completed-date': 'In progress',
          'certificate-url': '',
        });
      });

      it('should accept an empty link and store it as an empty string', () => {
        component.submit();

        expect(emitted).toHaveLength(1);
        expect(emitted[0]).toMatchObject({ certification: 'In Progress', certificateURL: '' });
      });

      it('should require the link again when switched back to earned', () => {
        setField(fixture, 'certificate-status', 'Here');
        fixture.detectChanges();

        component.submit();

        expect(emitted).toHaveLength(0);
      });
    });

    describe('when a save is in flight', () => {
      beforeEach(() => {
        fillForm(fixture);
        fixture.componentRef.setInput('disabled', true);
        fixture.detectChanges();
      });

      it('should lock the fields', () => {
        expect(field(fixture, 'certificate-title').disabled).toBe(true);
      });

      it('should ignore a submit', () => {
        component.submit();

        expect(emitted).toHaveLength(0);
      });
    });
  });

  describe('when editing a certificate', () => {
    beforeEach(() => {
      openWith({ mode: 'edit', certificate: stored });
    });

    it('should fill the fields from the record', () => {
      expect(field(fixture, 'certificate-title').value).toBe('Angular Level 1 Certification');
      expect(field(fixture, 'certificate-organization').value).toBe('Angular Training');
      expect(field(fixture, 'certificate-status').value).toBe('Here');
      expect(field(fixture, 'certificate-completed-date').value).toBe('02/21/2024');
      expect(field(fixture, 'certificate-credential-id').value).toBe('5A20CF0');
      expect(field(fixture, 'certificate-url').value).toBe(stored.certificateURL);
      expect(field(fixture, 'certificate-description').value).toBe('A professional certification.');
    });

    it('should emit the same id with the edited values', () => {
      setField(fixture, 'certificate-title', 'Angular Level 1 Certification (renewed)');

      component.submit();

      expect(emitted).toEqual([{ ...stored, title: 'Angular Level 1 Certification (renewed)' }]);
    });

    it('should show None as a blank credential id and write it back as None', () => {
      openWith({
        mode: 'edit',
        certificate: {
          ...stored,
          id: 2,
          credentialID: 'None',
          certification: 'In Progress',
          certificateURL: '',
        },
      });

      expect(field(fixture, 'certificate-credential-id').value).toBe('');

      component.submit();

      expect(emitted[0]).toMatchObject({ id: 2, credentialID: 'None', certificateURL: '' });
    });

    it('should refill the fields when another record is opened', () => {
      openWith({ mode: 'edit', certificate: { ...stored, id: 4, title: 'Another' } });

      expect(field(fixture, 'certificate-title').value).toBe('Another');
    });
  });
});
