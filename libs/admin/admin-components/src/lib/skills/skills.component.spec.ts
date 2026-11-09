import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';

import { UtilityService } from '@portfolio-v2/shared/services';
import { ISkills } from '@portfolio-v2/state/dataModels';
import { StateActions } from '@portfolio-v2/state';
import { skillsSelector } from '@portfolio-v2/state/selectors';
import { SkillsComponent } from './skills.component';
import { SkillsWriter } from './services/skills-writer.service';

describe('SkillsComponent', () => {
  let component: SkillsComponent;
  let fixture: ComponentFixture<SkillsComponent>;
  let store: MockStore;
  let writer: jest.Mocked<SkillsWriter>;
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
    writer = createSpyObj(SkillsWriter);
    mockUtilityService = createSpyObj(UtilityService);
    mockUtilityService.seperateSentences.mockReturnValue('');
    await TestBed.configureTestingModule({
      imports: [SkillsComponent],
      providers: [
        provideMockStore(),
        {
          provide: SkillsWriter,
          useValue: writer,
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
    const root = fixture.nativeElement as HTMLElement;

    expect(component).toBeTruthy();
    expect(root.querySelector('.skills-section')).not.toBeNull();
    expect(root.querySelector('.form-range')).not.toBeNull();
  });

  it('should open the skills listener when the page opens', () => {
    expect(store.dispatch).toHaveBeenCalledWith(StateActions.skillsStateConnect());
  });

  it('should show the save failure next to Save', async () => {
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    mockUtilityService.breakStringToParagraphs.mockReturnValue(['line']);
    writer.save.mockRejectedValue(new Error('offline'));

    await component['updateData']();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      'Skills could not be saved.',
    );
  });
});

describe('SkillsComponent when the record arrives after the page opens', () => {
  let fixture: ComponentFixture<SkillsComponent>;
  let store: MockStore;

  beforeEach(async () => {
    const utility = createSpyObj(UtilityService);
    utility.seperateSentences.mockReturnValue('');
    await TestBed.configureTestingModule({
      imports: [SkillsComponent],
      providers: [
        provideMockStore(),
        { provide: SkillsWriter, useValue: createSpyObj(SkillsWriter) },
        { provide: UtilityService, useValue: utility },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(skillsSelector, undefined);
    fixture = TestBed.createComponent(SkillsComponent);
    fixture.detectChanges();
  });

  it('should fill the form from the first stored record', () => {
    expect(fixture.componentInstance['skillsForm'].skillsIntro().value()).toBe('');

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
    expect(form.skillsIntro().value()).toBe('Some intro');
    expect(fixture.componentInstance['languageLevels']().TypeScript).toBe(80);
  });
});
