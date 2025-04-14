import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MockComponent } from 'ng-mocks';

import { WeatherDisplayComponent } from '@portfolio-v2/shared/components';
import {
  isAdminModeSelector,
  isPreviewModeSelector,
  isPartyModeSelector,
} from '@portfolio-v2/state/selectors';
import {
  AuthService,
  WeatherService,
} from '@portfolio-v2/shared/services';
import { NavBarComponent } from './nav-bar.component';

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
    });
  });
});
