import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { createSpyObj } from 'jest-createspyobj';

import {
  GetDataService,
  GetDateTimeService,
} from '@portfolio-v2/shared/services';
import { CoverLetterComponent } from './cover_letter.component';

describe('CoverLetterComponent', () => {
  let component: CoverLetterComponent;
  let fixture: ComponentFixture<CoverLetterComponent>;
  let mockDateTimeService: jest.Mocked<GetDateTimeService>;
  let mockDataService: jest.Mocked<GetDataService>;

  beforeEach(async () => {
    mockDateTimeService = createSpyObj(GetDateTimeService);
    mockDataService = createSpyObj(GetDataService);
    await TestBed.configureTestingModule({
      imports: [CoverLetterComponent],
      providers: [
        {
          provide: GetDateTimeService,
          useValue: mockDateTimeService,
        },
        {
          provide: GetDataService,
          useValue: mockDataService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CoverLetterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
