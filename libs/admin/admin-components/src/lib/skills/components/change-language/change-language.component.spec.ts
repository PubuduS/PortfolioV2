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
import { MockComponents } from 'ng-mocks';

import {
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { DisplayValidatorErrorsComponent } from '@portfolio-v2/admin/shared/components';
import { ISkills } from '@portfolio-v2/state/dataModels';
import { skillsSelector } from '@portfolio-v2/state/selectors';
import { ChangeLanguageComponent } from './change-language.component';

describe('ChangeLanguageComponent', () => {
  let component: ChangeLanguageComponent;
  let fixture: ComponentFixture<ChangeLanguageComponent>;
  let store: MockStore;
  let mockSetDataService: jest.Mocked<SetDataService>;
  let mockUtilityService: jest.Mocked<UtilityService>;
  const mockSkills: ISkills = {
    id: 1,
    intro: 'Some intro',
    languagesCol1: {
      'some language1': 10,
      'some language2': 20,
      'some language3': 30,
    },

    languagesCol2: {
      'some language4': 40,
      'some language5': 50,
      'some language6': 60,
    },
    toolHeading: 'some heading',
    leftSubHeading: 'left sub heading',
    framework: ['framework 1', 'framework 2', 'framework 3'],
    rightSubHeading: 'right sub heading',
    software: ['software 1', 'software 2', 'software 3', 'software 4'],
  };

  beforeEach(async () => {
    mockSetDataService = createSpyObj(SetDataService);
    mockUtilityService = createSpyObj(UtilityService);
    await TestBed.configureTestingModule({
      imports: [
        ChangeLanguageComponent,
        MockComponents(DisplayValidatorErrorsComponent),
      ],
      providers: [
        provideMockStore(),
        FormBuilder,
        {
          provide: SetDataService,
          useValue: mockSetDataService,
        },
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(skillsSelector, mockSkills);
    fixture = TestBed.createComponent(ChangeLanguageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
