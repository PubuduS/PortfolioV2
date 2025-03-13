import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';

import { GetDateTimeService } from '@portfolio-v2/shared/services';
import { LandingBannerComponent } from './landing_banner.component';

describe('LandingBannerComponent', () => {
  let component: LandingBannerComponent;
  let fixture: ComponentFixture<LandingBannerComponent>;
  let mockDateTimeService: jest.Mocked<GetDateTimeService>;

  beforeEach(async () => {
    mockDateTimeService = createSpyObj(GetDateTimeService);
    await TestBed.configureTestingModule({
      imports: [LandingBannerComponent],
      providers: [
        provideMockStore(),
        {
          provide: GetDateTimeService,
          useValue: mockDateTimeService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
