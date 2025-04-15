import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';
import { FormBuilder } from '@angular/forms';
import { MockComponent } from 'ng-mocks';

import { SetDataService } from '@portfolio-v2/shared/services';
import { IAboutMe } from '@portfolio-v2/state/dataModels';
import { aboutMeSelector } from '@portfolio-v2/state/selectors';
import { DisplayValidatorErrorsComponent } from '@portfolio-v2/shared/components';
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
      imports: [
        AboutMeComponent,
        MockComponent(DisplayValidatorErrorsComponent),
      ],
      providers: [
        provideMockStore(),
        FormBuilder,
        {
          provide: SetDataService,
          useValue: mockSetDataService,
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(aboutMeSelector, mockData);
    fixture = TestBed.createComponent(AboutMeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
