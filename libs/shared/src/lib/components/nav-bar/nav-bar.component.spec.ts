import { signal } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { of } from 'rxjs';
import { MockComponent } from 'ng-mocks';

import { WeatherDisplayComponent } from '@portfolio-v2/shared/components';
import {
  AuthService,
  DocumentCatalogReader,
  WeatherService,
} from '@portfolio-v2/shared/services';
import { StateActions } from '@portfolio-v2/state';
import {
  createVersionId,
  parseCatalog,
  storageObjectPath,
  type CatalogView,
} from '@portfolio-v2/state/dataModels';
import {
  isAdminModeSelector,
  isPreviewModeSelector,
  isPartyModeSelector,
} from '@portfolio-v2/state/selectors';
import { NavBarComponent } from './nav-bar.component';

/**
 * @returns a ready resume view with a stored download url
 */
function storedResume(): CatalogView {
  const id = createVersionId(1730000000000, 1);
  const parsed = parseCatalog('resume', {
    versions: [{
      id,
      uploadedAt: '2026-01-01T00:00:00.000Z',
      storagePath: storageObjectPath('resume', id),
      downloadUrl: 'https://files.example/resume.pdf',
      pendingDeletes: [],
    }],
  });
  if (!parsed.ok) {
    throw new Error('resume fixture is unreadable');
  }
  return { status: 'ready', catalog: parsed.catalog };
}

/**
 * @param root nav element
 * @param label link text
 * @returns the anchor
 */
function navLink(root: ParentNode, label: string): HTMLAnchorElement {
  const anchor = [...root.querySelectorAll('a')].find(
    (item) => item.textContent?.trim() === label,
  );
  if (!(anchor instanceof HTMLAnchorElement)) {
    throw new Error(`missing ${label} link`);
  }
  return anchor;
}

describe('NavBarComponent', () => {
  let component: NavBarComponent;
  let fixture: ComponentFixture<NavBarComponent>;
  let store: MockStore;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockWeatherService: jest.Mocked<WeatherService>;
  let nativeElement: Element;

  beforeEach(async () => {
    mockAuthService = createSpyObj(AuthService);
    mockWeatherService = createSpyObj(WeatherService);
    await TestBed.configureTestingModule({
      imports: [
        NavBarComponent,
        MockComponent(WeatherDisplayComponent),
      ],
      providers: [
        provideMockStore(),
        {
          provide: DocumentCatalogReader,
          useValue: { view: () => signal(storedResume()) },
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: WeatherService,
          useValue: mockWeatherService,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'some-id', // mock your route params here
              },
            },
            queryParams: of({}), // mock query params if needed
            params: of({}), // mock route params if needed
          },
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(isAdminModeSelector, false);
    store.overrideSelector(isPreviewModeSelector, false);
    store.overrideSelector(isPartyModeSelector, false);
    fixture = TestBed.createComponent(NavBarComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Button behaviour', () => {
    describe('When not in admin mode', () => {
      it('should not display preview button', () => {
        const previewBtn = nativeElement.querySelector('#previewMode');
        expect(previewBtn).toBeFalsy();
      });

      it('should display admin button', () => {
        const partyBtn = nativeElement.querySelector('#partyMode');
        expect(partyBtn).toBeTruthy();
      });
    });

    describe('When in admin mode', () => {
      beforeEach(() => {
        isAdminModeSelector.setResult(true);
        store.refreshState();
        fixture.detectChanges();
      });

      it('should display preview button', () => {
        const previewBtn = nativeElement.querySelector('#previewMode');
        expect(previewBtn).toBeTruthy();
      });

      it('mirrors the current page when preview is clicked', () => {
        const router = TestBed.inject(Router);
        jest.spyOn(router, 'url', 'get').mockReturnValue(
          '/content/education/publications?edit=3',
        );
        const navigate = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
        const dispatch = jest.spyOn(store, 'dispatch');
        const preview = nativeElement.querySelector('#previewMode');
        if (!(preview instanceof HTMLElement)) {
          throw new Error('preview button missing');
        }

        preview.click();

        expect(navigate).toHaveBeenCalledWith('/admin/education/publications');
        expect(dispatch).toHaveBeenCalledWith(
          StateActions.previewModeStateUpdated({ isPreviewMode: true }),
        );
      });
    });
  });

  describe('document links', () => {
    it('should keep a resume file href and the cover-letter page for a visitor', () => {
      const resume = navLink(nativeElement, 'Resume');
      const coverLetter = navLink(nativeElement, 'Cover Letter');

      expect(resume.getAttribute('target')).toBe('_blank');
      expect(resume.getAttribute('href')).toBe('https://files.example/resume.pdf');
      expect(coverLetter.getAttribute('href')).toBe('/content/coverletter');
    });

    describe('when the admin is not previewing', () => {
      beforeEach(() => {
        isAdminModeSelector.setResult(true);
        isPreviewModeSelector.setResult(false);
        store.refreshState();
        fixture.detectChanges();
      });

      it('should use both admin paths', () => {
        expect(navLink(nativeElement, 'Resume').getAttribute('href')).toBe('/admin/resume');
        expect(navLink(nativeElement, 'Resume').getAttribute('target')).toBeNull();
        expect(navLink(nativeElement, 'Cover Letter').getAttribute('href')).toBe('/admin/coverletter');
      });
    });

    describe('when preview is on', () => {
      beforeEach(() => {
        isAdminModeSelector.setResult(true);
        isPreviewModeSelector.setResult(true);
        store.refreshState();
        fixture.detectChanges();
      });

      it('should use the visitor destinations', () => {
        const resume = navLink(nativeElement, 'Resume');

        expect(resume.getAttribute('target')).toBe('_blank');
        expect(resume.getAttribute('href')).toBe('https://files.example/resume.pdf');
        expect(navLink(nativeElement, 'Cover Letter').getAttribute('href')).toBe('/content/coverletter');
      });
    });
  });
});
