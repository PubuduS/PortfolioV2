import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';

import { skillsSelector } from '@portfolio-v2/state/selectors';
import { ISkills } from '@portfolio-v2/state/dataModels';
import { SkillsComponent } from './skills.component';

describe('SkillsComponent', () => {
  let component: SkillsComponent;
  let fixture: ComponentFixture<SkillsComponent>;
  let store: MockStore;
  const mockSkills: ISkills = {
    id: 1,
    heading: 'Skills',
    intro: 'Some intro',
    languagesCol1: new Map([
      ['some language1', 10],
      ['some language2', 20],
      ['some language3', 30],
    ]),
    languagesCol2: new Map([
      ['some language4', 40],
      ['some language5', 50],
      ['some language6', 60],
    ]),
    toolHeading: 'some heading',
    leftSubHeading: 'left sub heading',
    framework: ['framework 1', 'framework 2', 'framework 3'],
    rightSubHeading: 'right sub heading',
    software: ['software 1', 'software 2', 'software 3', 'software 4'],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillsComponent],
      providers: [
        provideMockStore(),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(skillsSelector, mockSkills);
    fixture = TestBed.createComponent(SkillsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
