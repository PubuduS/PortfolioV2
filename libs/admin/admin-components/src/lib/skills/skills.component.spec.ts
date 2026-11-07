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
import { StateActions } from '@portfolio-v2/state';
import { skillsSelector } from '@portfolio-v2/state/selectors';
import { SkillsComponent } from './skills.component';

describe('SkillsComponent', () => {
  let component: SkillsComponent;
  let fixture: ComponentFixture<SkillsComponent>;
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
        SkillsComponent,
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
    jest.spyOn(store, 'dispatch');
    store.overrideSelector(skillsSelector, mockSkills);
    fixture = TestBed.createComponent(SkillsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open the skills listener when the page opens', () => {
    expect(store.dispatch).toHaveBeenCalledWith(StateActions.skillsStateConnect());
  });
});

describe('SkillsComponent when the record arrives after the page opens', () => {
  let fixture: ComponentFixture<SkillsComponent>;
  let store: MockStore;

  beforeEach(async () => {
    const utility = createSpyObj(UtilityService);
    utility.seperateSentences.mockReturnValue('');
    await TestBed.configureTestingModule({
      imports: [
        SkillsComponent,
        MockComponents(DisplayValidatorErrorsComponent),
      ],
      providers: [
        provideMockStore(),
        FormBuilder,
        { provide: SetDataService, useValue: createSpyObj(SetDataService) },
        { provide: UtilityService, useValue: utility },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(skillsSelector, undefined);
    fixture = TestBed.createComponent(SkillsComponent);
    fixture.detectChanges();
  });

  it('should fill the form from the first stored record', () => {
    expect(fixture.componentInstance['skillsForm'].get('skillsIntro')?.value).toBe('');

    store.overrideSelector(skillsSelector, {
      id: 1,
      intro: 'Some intro',
      languagesCol1: { TypeScript: 80 },
      languagesCol2: {},
      toolHeading: 'Tools',
      leftSubHeading: 'Frameworks',
      framework: ['Angular'],
      rightSubHeading: 'Software',
      software: ['Git'],
    });
    store.refreshState();
    fixture.detectChanges();

    const form = fixture.componentInstance['skillsForm'];
    expect(form.get('skillsIntro')?.value).toBe('Some intro');
    expect(form.get('TypeScript')?.value).toBe(80);
  });
});
