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
import { experienceSelector } from '@portfolio-v2/state/selectors';
import { IExperience } from '@portfolio-v2/state/dataModels';
import { ExperienceComponent } from './experience.component';

describe('ExperienceComponent', () => {
  let component: ExperienceComponent;
  let fixture: ComponentFixture<ExperienceComponent>;
  let store: MockStore;
  let mockDateTimeService: jest.Mocked<GetDateTimeService>;
  const mockData: IExperience[] = [{
    id: 1,
    position: 'some position',
    employer: 'some employer',
    timePeriod: '2024 - Present',
    shortDescription: 'shor description',
    points: ['point 1', 'point 2', 'point 3'],
    startDate: '2021-03-12',
    endDate: '2023-03-12',
    isCurrent: false,
  }];

  beforeEach(async () => {
    mockDateTimeService = createSpyObj(GetDateTimeService);
    await TestBed.configureTestingModule({
      imports: [ExperienceComponent],
      providers: [
        provideMockStore(),
        {
          provide: GetDateTimeService,
          useValue: mockDateTimeService,
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(experienceSelector, mockData);
    fixture = TestBed.createComponent(ExperienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
