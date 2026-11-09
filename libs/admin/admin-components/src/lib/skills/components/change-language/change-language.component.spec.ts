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
import { skillsSelector } from '@portfolio-v2/state/selectors';
import { SkillsWriter } from '../../services/skills-writer.service';
import { ChangeLanguageComponent } from './change-language.component';

describe('ChangeLanguageComponent', () => {
  let component: ChangeLanguageComponent;
  let fixture: ComponentFixture<ChangeLanguageComponent>;
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
      imports: [ChangeLanguageComponent],
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
    store.overrideSelector(skillsSelector, mockSkills);
    fixture = TestBed.createComponent(ChangeLanguageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the save failure next to Save', async () => {
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    mockUtilityService.breakStringToParagraphs.mockReturnValue([
      'some language1',
      'some language2',
      'some language3',
      'some language4',
      'some language5',
      'some language6',
    ]);
    writer.save.mockRejectedValue(new Error('offline'));

    await component.saveLanguageKeys();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      'Skills could not be saved.',
    );
  });
});
