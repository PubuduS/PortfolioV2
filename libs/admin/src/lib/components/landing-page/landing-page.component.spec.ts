import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { createSpyObj } from 'jest-createspyobj';
import {
  FormBuilder,
  Validators,
} from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SetDataService } from '@portfolio-v2/shared/services';
import { LandingPageComponent } from './landing-page.component';

describe('LandingPageComponent', () => {
  let component: LandingPageComponent;
  let fixture: ComponentFixture<LandingPageComponent>;
  let mockSetDataService: jest.Mocked<SetDataService>;

  beforeEach(async () => {
    mockSetDataService = createSpyObj(SetDataService);

    await TestBed.configureTestingModule({
      imports: [
        LandingPageComponent,
        BrowserAnimationsModule,
      ],
      providers: [
        FormBuilder,
        {
          provide: SetDataService,
          useValue: mockSetDataService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with default values', () => {
      expect(component['landingnForm'].get('filePicker')?.value).toBe('');
      expect(component['landingnForm'].get('seasonsPicker')?.value).toBe('winter');
    });

    it('should have required validators', () => {
      const filePicker = component['landingnForm'].get('filePicker');
      const seasonsPicker = component['landingnForm'].get('seasonsPicker');

      expect(filePicker?.hasValidator(Validators.required)).toBeTruthy();
      expect(seasonsPicker?.hasValidator(Validators.required)).toBeTruthy();
    });
  });

  describe('Path Generation', () => {
    it('should generate correct winter path', () => {
      const path = component['getCorrectBannerPath']('winter');
      expect(path).toBe('portfolio/landing-page/banners/winter/Winter_Banner.gif');
    });

    it('should generate correct spring path', () => {
      const path = component['getCorrectBannerPath']('spring');
      expect(path).toBe('portfolio/landing-page/banners/spring/Spring_Banner.gif');
    });

    it('should generate fall path as default', () => {
      const path = component['getCorrectBannerPath']('fall');
      expect(path).toBe('portfolio/landing-page/banners/fall/Fall_Banner.gif');
    });
  });
});
