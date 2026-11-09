import { signal } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';
import Docxtemplater from 'docxtemplater';
import { createSpyObj } from 'jest-createspyobj';

import {
  DocumentCatalogReader,
  GetDateTimeService,
} from '@portfolio-v2/shared/services';
import { StateActions } from '@portfolio-v2/state';
import {
  parseCatalog,
  type CatalogView,
  type ISocialInfo,
} from '@portfolio-v2/state/dataModels';
import { socialMediaSelector } from '@portfolio-v2/state/selectors';
import { CoverLetterComponent } from './cover-letter.component';

jest.mock('pizzip', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((bytes: ArrayBuffer) => ({ bytes })),
}));

jest.mock('docxtemplater', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    setData: jest.fn(),
    render: jest.fn(),
    getZip: () => ({
      generate: () => new Blob(['docx']),
    }),
  })),
}));

jest.mock('file-saver', () => ({
  __esModule: true,
  saveAs: jest.fn(),
}));

/**
 * @param status catalog status the generate button watches
 * @returns a reader view
 */
function coverView(status: CatalogView['status']): CatalogView {
  if (status !== 'ready') {
    return { status };
  }
  const parsed = parseCatalog('cover-letter', undefined);
  if (!parsed.ok) {
    throw new Error('empty catalog should be readable');
  }
  return { status: 'ready', catalog: parsed.catalog };
}

describe('CoverLetterComponent', () => {
  let component: CoverLetterComponent;
  let fixture: ComponentFixture<CoverLetterComponent>;
  let mockDateTimeService: jest.Mocked<GetDateTimeService>;
  let store: MockStore;
  let documents: { view: jest.Mock; coverLetterTemplate: jest.Mock };
  let view: ReturnType<typeof signal<CatalogView>>;
  const links: ISocialInfo[] = [
    {
      id: 1,
      media: 'https://www.linkedin.com/in/ada',
      mediaIcon: 'fa-linkedin',
    },
    {
      id: 3,
      media: 'ada@example.test',
      mediaIcon: 'fa-envelope',
    },
  ];

  beforeEach(async () => {
    mockDateTimeService = createSpyObj(GetDateTimeService);
    mockDateTimeService.getDate.mockReturnValue('January 1, 2026');
    view = signal(coverView('ready'));
    documents = {
      view: jest.fn(() => view),
      coverLetterTemplate: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    };
    await TestBed.configureTestingModule({
      imports: [CoverLetterComponent],
      providers: [
        provideMockStore(),
        { provide: GetDateTimeService, useValue: mockDateTimeService },
        { provide: DocumentCatalogReader, useValue: documents },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(socialMediaSelector, links);
    jest.spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(CoverLetterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should read social links from the store', () => {
    expect(store.dispatch).toHaveBeenCalledWith(StateActions.socialMediaInformationStateConnect());
    const icons = fixture.nativeElement.querySelectorAll('ul.social a');
    expect(icons).toHaveLength(2);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should disable generate while the cover-letter view is loading', () => {
    const company = fixture.nativeElement.querySelector('input[placeholder="Company Name"]');
    expect(company).toBeInstanceOf(HTMLInputElement);
    if (!(company instanceof HTMLInputElement)) {
      return;
    }
    company.value = 'Acme';
    company.dispatchEvent(new Event('input'));
    view.set(coverView('loading'));
    fixture.detectChanges();

    const generate = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(generate).toBeInstanceOf(HTMLButtonElement);
    if (!(generate instanceof HTMLButtonElement)) {
      return;
    }
    expect(generate.disabled).toBe(true);
  });

  it('should ask the reader for template bytes and keep an empty manager as Hiring Committee', async () => {
    const company = fixture.nativeElement.querySelector('input[placeholder="Company Name"]');
    if (!(company instanceof HTMLInputElement)) {
      throw new Error('missing company field');
    }
    company.value = 'Acme';
    company.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const generate = fixture.nativeElement.querySelector('button[type="submit"]');
    if (!(generate instanceof HTMLButtonElement)) {
      throw new Error('missing generate button');
    }
    generate.click();
    await fixture.whenStable();

    expect(documents.coverLetterTemplate).toHaveBeenCalledTimes(1);
    const created = jest.mocked(Docxtemplater).mock.results.at(-1)?.value as {
      setData: jest.Mock;
    };
    expect(created.setData).toHaveBeenCalledWith({
      Date: 'January 1, 2026',
      Manager: 'Hiring Committee',
      Position: 'Software Engineer',
      Company: 'Acme',
    });
  });
});
