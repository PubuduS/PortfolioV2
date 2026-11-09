import { provideZonelessChangeDetection } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';

import { GetDateTimeService } from '@portfolio-v2/shared/services';
import { StateActions } from '@portfolio-v2/state';
import { IExperience } from '@portfolio-v2/state/dataModels';
import { experienceSelector } from '@portfolio-v2/state/selectors';
import { ExperienceComponent } from './experience.component';

describe('ExperienceComponent', () => {
  let component: ExperienceComponent;
  let fixture: ComponentFixture<ExperienceComponent>;
  let store: MockStore;
  let mockDateTimeService: jest.Mocked<GetDateTimeService>;
  const firstJob: IExperience = {
    id: 1,
    position: 'some position',
    employer: 'some employer',
    timePeriod: '2024 - Present',
    shortDescription: 'shor description',
    points: ['point 1', 'point 2', 'point 3'],
    startDate: '2021-03-12',
    endDate: '2023-03-12',
    isCurrent: false,
  };
  const secondJob: IExperience = {
    id: 2,
    position: 'later position',
    employer: 'later employer',
    timePeriod: '2020 - 2021',
    shortDescription: 'earlier role',
    points: ['earlier point'],
    startDate: '2020-01-01',
    endDate: '2021-01-01',
    isCurrent: false,
  };

  beforeEach(async () => {
    mockDateTimeService = createSpyObj(GetDateTimeService);
    await TestBed.configureTestingModule({
      imports: [ExperienceComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideMockStore(),
        {
          provide: GetDateTimeService,
          useValue: mockDateTimeService,
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(experienceSelector, undefined);
    jest.spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(ExperienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should connect the experience section when the page opens', () => {
    expect(store.dispatch).toHaveBeenCalledWith(StateActions.experienceStateConnect());
  });

  describe('when jobs arrive', () => {
    it('should show the first job', async () => {
      mockDateTimeService.getYearsOfExperience.mockReturnValue(2);
      store.overrideSelector(experienceSelector, [firstJob, secondJob]);
      store.refreshState();
      await fixture.whenStable();

      const root = fixture.nativeElement as HTMLElement;
      const text = root.textContent ?? '';
      expect(root.querySelector('.experience-section .tabs-wrapper > .nav')).not.toBeNull();
      expect(root.querySelector('.tab-content')).not.toBeNull();
      expect(text).toContain('some employer');
      expect(text).toContain('some position');
      expect(text).toContain('2 Years');
    });
  });

  describe('when a job tab is clicked', () => {
    it('should show that job', async () => {
      mockDateTimeService.getYearsOfExperience.mockReturnValue(1);
      store.overrideSelector(experienceSelector, [firstJob, secondJob]);
      store.refreshState();
      await fixture.whenStable();

      const tabs = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('a.nav-link');
      tabs[1]?.click();
      await fixture.whenStable();

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('later position');
      expect(text).toContain('1 Year');
    });
  });
});
