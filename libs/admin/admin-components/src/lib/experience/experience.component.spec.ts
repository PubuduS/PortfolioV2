import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';
import { MockComponents } from 'ng-mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import {
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { StateActions } from '@portfolio-v2/state';
import { experienceSelector } from '@portfolio-v2/state/selectors';
import { IExperience } from '@portfolio-v2/state/dataModels';
import { AdminExperienceComponent } from './experience.component';
import { DeleteComformationComponent } from './components/delete-comformation.component';

describe('AdminExperienceComponent', () => {
  let component: AdminExperienceComponent;
  let fixture: ComponentFixture<AdminExperienceComponent>;
  let store: MockStore;
  let mockUtilityService: jest.Mocked<UtilityService>;
  let mockSetDataService: jest.Mocked<SetDataService>;
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
    mockUtilityService = createSpyObj(UtilityService);
    mockSetDataService = createSpyObj(SetDataService);
    await TestBed.configureTestingModule({
      imports: [
        AdminExperienceComponent,
        MockComponents(DeleteComformationComponent),
        NoopAnimationsModule,
      ],
      providers: [
        provideMockStore(),
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
        {
          provide: SetDataService,
          useValue: mockSetDataService,
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    jest.spyOn(store, 'dispatch');
    store.overrideSelector(experienceSelector, mockData);
    fixture = TestBed.createComponent(AdminExperienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open the experience listener when the page opens', () => {
    expect(store.dispatch).toHaveBeenCalledWith(StateActions.experienceStateConnect());
  });
});

describe('AdminExperienceComponent when the record arrives after the page opens', () => {
  let fixture: ComponentFixture<AdminExperienceComponent>;
  let store: MockStore;

  beforeEach(async () => {
    const utility = createSpyObj(UtilityService);
    utility.seperateSentences.mockReturnValue('point 1');
    await TestBed.configureTestingModule({
      imports: [
        AdminExperienceComponent,
        MockComponents(DeleteComformationComponent),
        NoopAnimationsModule,
      ],
      providers: [
        provideMockStore(),
        { provide: UtilityService, useValue: utility },
        { provide: SetDataService, useValue: createSpyObj(SetDataService) },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(experienceSelector, []);
    fixture = TestBed.createComponent(AdminExperienceComponent);
    fixture.detectChanges();
  });

  it('should fill the form from the first stored job', () => {
    expect(fixture.componentInstance['experienceForm'].employer().value()).toBe('');

    store.overrideSelector(experienceSelector, [{
      id: 1,
      position: 'some position',
      employer: 'some employer',
      timePeriod: '2024 - Present',
      shortDescription: 'short description',
      points: ['point 1'],
      startDate: '2021-03-12',
      endDate: '2023-03-12',
      isCurrent: false,
    }]);
    store.refreshState();
    fixture.detectChanges();

    const form = fixture.componentInstance['experienceForm'];
    expect(form.employer().value()).toBe('some employer');
    expect(form.position().value()).toBe('some position');
  });
});
