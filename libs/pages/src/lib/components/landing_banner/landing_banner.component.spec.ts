import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { LandingBannerComponent } from './landing_banner.component';

describe('LandingBannerComponent', () => {
  let component: LandingBannerComponent;
  let fixture: ComponentFixture<LandingBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
