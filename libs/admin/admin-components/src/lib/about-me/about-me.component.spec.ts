import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';

import { SetDataService } from '@portfolio-v2/shared/services';
import { IAboutMe } from '@portfolio-v2/state/dataModels';
import { StateActions } from '@portfolio-v2/state';
import { aboutMeSelector } from '@portfolio-v2/state/selectors';
import { AboutMeComponent } from './about-me.component';

describe('AboutMeComponent', () => {
  let component: AboutMeComponent;
  let fixture: ComponentFixture<AboutMeComponent>;
  let store: MockStore;
  let mockSetDataService: jest.Mocked<SetDataService>;
  const mockData: IAboutMe = {
    id: 1,
    imageSrc: 'some url',
    intro: ['some intro1', 'another intro'],
    subHeadingIntro: 'sub heading intro',
    leftPoints: ['point 1', 'point 2', 'point 3'],
    rightPoints: ['point 4', 'point 5', 'point 6'],
    link: 'some link',
  };

  beforeEach(async () => {
    mockSetDataService = createSpyObj(SetDataService);
    await TestBed.configureTestingModule({
      imports: [AboutMeComponent],
      providers: [
        provideMockStore(),
        {
          provide: SetDataService,
          useValue: mockSetDataService,
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    jest.spyOn(store, 'dispatch');
    store.overrideSelector(aboutMeSelector, mockData);
    fixture = TestBed.createComponent(AboutMeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open the about listener when the page opens', () => {
    expect(store.dispatch).toHaveBeenCalledWith(StateActions.aboutMeStateConnect());
  });

  it('should keep an edited form when a later store update arrives', () => {
    component['aboutMeForm'].mainIntro().value.set('edited intro');
    store.overrideSelector(aboutMeSelector, {
      ...mockData,
      intro: ['a replacement intro'],
    });
    store.refreshState();
    fixture.detectChanges();

    expect(component['aboutMeForm'].mainIntro().value()).toBe('edited intro');
  });
});

describe('AboutMeComponent when the record arrives after the page opens', () => {
  let fixture: ComponentFixture<AboutMeComponent>;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutMeComponent],
      providers: [
        provideMockStore(),
        { provide: SetDataService, useValue: createSpyObj(SetDataService) },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(aboutMeSelector, undefined);
    fixture = TestBed.createComponent(AboutMeComponent);
    fixture.detectChanges();
  });

  it('should fill the form from the first stored record', () => {
    expect(fixture.componentInstance['aboutMeForm'].mainIntro().value()).toBe('');

    store.overrideSelector(aboutMeSelector, {
      id: 1,
      imageSrc: 'some url',
      intro: ['some intro1', 'another intro'],
      subHeadingIntro: 'sub heading intro',
      leftPoints: ['point 1'],
      rightPoints: ['point 4'],
      link: 'some link',
    });
    store.refreshState();
    fixture.detectChanges();

    expect(fixture.componentInstance['aboutMeForm'].mainIntro().value()).toBe(
      'some intro1\n\nanother intro',
    );
    expect(fixture.componentInstance['aboutMeForm'].linkField().value()).toBe('some link');
  });
});
