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
import { experienceSelector } from '@portfolio-v2/state/selectors';
import { IExperience } from '@portfolio-v2/state/dataModels';
import { DisplayValidatorErrorsComponent } from '@portfolio-v2/admin/shared/components';
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
        MockComponents(
          DisplayValidatorErrorsComponent,
          DeleteComformationComponent,
        ),
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
    store.overrideSelector(experienceSelector, mockData);
    fixture = TestBed.createComponent(AdminExperienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
