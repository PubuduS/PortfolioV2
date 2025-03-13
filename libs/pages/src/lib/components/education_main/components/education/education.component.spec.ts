import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';

import { educationSelector } from '@portfolio-v2/state/selectors';
import { IEducation } from '@portfolio-v2/state/dataModels';
import { EducationComponent } from './education.component';

describe('EducationComponent', () => {
  let component: EducationComponent;
  let fixture: ComponentFixture<EducationComponent>;
  let store: MockStore;
  const mockEducation: IEducation[] = [{
    id: 1,
    title: 'some title',
    period: '2021 - 2022',
    degree: 'some degree',
    gpa: '3.94',
    awards: 'some award',
    credits: '30',
    graduated: '2019 May 04',
    extra: 'some extra',
  },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EducationComponent],
      providers: [
        provideMockStore(),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(educationSelector, mockEducation);
    fixture = TestBed.createComponent(EducationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
