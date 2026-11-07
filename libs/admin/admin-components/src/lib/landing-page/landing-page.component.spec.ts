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
    it('should initialize form with the winter season', () => {
      expect(component['landingnForm'].get('seasonsPicker')?.value).toBe('winter');
    });

    it('should require a season', () => {
      const seasonsPicker = component['landingnForm'].get('seasonsPicker');
      expect(seasonsPicker?.hasValidator(Validators.required)).toBeTruthy();
    });
  });

  describe('Path Generation', () => {
    it('should use the public banner file names', () => {
      expect(component['bannerStoragePath']('fall', 'poster-mobile.webp')).toBe(
        'portfolio/landing-page/banners/fall/Fall_Banner-poster-mobile.webp',
      );
      expect(component['bannerStoragePath']('spring', 'desktop.webm')).toBe(
        'portfolio/landing-page/banners/spring/Spring_Banner-desktop.webm',
      );
      expect(component['bannerStoragePath']('winter', 'mobile.mp4')).toBe(
        'portfolio/landing-page/banners/winter/Winter_Banner-mobile.mp4',
      );
    });
  });

  describe('Upload', () => {
    beforeEach(() => {
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        value: jest.fn(() => 'blob:poster'),
      });
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        value: jest.fn(),
      });
      mockSetDataService.getProgressValue.mockReturnValue(100);
    });

    it('should leave upload disabled until a file is chosen', () => {
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);

      const input: HTMLInputElement = fixture.nativeElement.querySelector(
        '[id="poster-mobile.webp"]',
      );
      const file = new File(['still'], 'poster.webp', { type: 'image/webp' });
      Object.defineProperty(input, 'files', { value: [file] });
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(button.disabled).toBe(false);
    });

    it('should not upload when no file is chosen', async () => {
      await component.uploadSelectedFiles();

      expect(mockSetDataService.pushFileToStorage).not.toHaveBeenCalled();
    });

    it('should upload a chosen still to the public banner path', async () => {
      mockSetDataService.pushFileToStorage.mockResolvedValue(undefined);
      const file = new File(['still'], 'poster.webp', { type: 'image/webp' });
      component['selectedFiles'].set('poster-mobile.webp', file);
      component['landingnForm'].patchValue({ seasonsPicker: 'fall' });

      await component.uploadSelectedFiles();

      expect(mockSetDataService.pushFileToStorage).toHaveBeenCalledWith(
        'portfolio/landing-page/banners/fall/Fall_Banner-poster-mobile.webp',
        'blob:poster',
      );
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:poster');
    });

    it('should upload the next file only after the previous one finishes', async () => {
      let releaseFirst: () => void = () => undefined;
      mockSetDataService.pushFileToStorage
        .mockImplementationOnce(() => new Promise((resolve) => {
          releaseFirst = resolve;
        }))
        .mockResolvedValueOnce(undefined);
      component['selectedFiles'].set(
        'poster-mobile.webp',
        new File(['still'], 'poster.webp', { type: 'image/webp' }),
      );
      component['selectedFiles'].set(
        'desktop.webm',
        new File(['clip'], 'desktop.webm', { type: 'video/webm' }),
      );

      const pending = component.uploadSelectedFiles();
      await Promise.resolve();
      expect(mockSetDataService.pushFileToStorage).toHaveBeenCalledTimes(1);

      releaseFirst();
      await pending;

      expect(mockSetDataService.pushFileToStorage).toHaveBeenNthCalledWith(
        1,
        'portfolio/landing-page/banners/winter/Winter_Banner-poster-mobile.webp',
        'blob:poster',
      );
      expect(mockSetDataService.pushFileToStorage).toHaveBeenNthCalledWith(
        2,
        'portfolio/landing-page/banners/winter/Winter_Banner-desktop.webm',
        'blob:poster',
      );
      expect(component['isUploadCompleted']).toBe(true);
    });
  });
});
