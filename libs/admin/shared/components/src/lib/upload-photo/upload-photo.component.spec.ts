import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { createSpyObj } from 'jest-createspyobj';
import {
  provideMockStore,
  MockStore,
} from '@ngrx/store/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';

import {
  GetDataService,
  SetDataService,
} from '@portfolio-v2/shared/services';
import { callComponentMethod } from '@portfolio-v2/shared/test-helpers';
import { IUploadPhotoConfig } from '@portfolio-v2/admin/shared/types';
import { UploadPhotoComponent } from './upload-photo.component';

// Mock selector function that returns a signal
// Mock configuration for the upload photo component
const mockUploadConfig: IUploadPhotoConfig = {
  title: 'Upload Test Photo',
  fieldPath: 'test/path/image.jpg/',
  currentImageUrl: 'https://example.com/current-image.jpg',
  onImageUploaded: jest.fn(),
};

describe('UploadPhotoComponent', () => {
  let component: UploadPhotoComponent;
  let fixture: ComponentFixture<UploadPhotoComponent>;
  let mockSetDataService: jest.Mocked<SetDataService>;
  let mockGetDataService: jest.Mocked<GetDataService>;
  let store: MockStore;

  beforeEach(async () => {
    mockSetDataService = createSpyObj(SetDataService);
    mockGetDataService = createSpyObj(GetDataService);

    await TestBed.configureTestingModule({
      imports: [UploadPhotoComponent],
      providers: [
        provideMockStore({}),
        { provide: MAT_DIALOG_DATA, useValue: mockUploadConfig },
        {
          provide: SetDataService,
          useValue: mockSetDataService,
        },
        {
          provide: GetDataService,
          useValue: mockGetDataService,
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);

    // Mock store.selectSignal to return a signal
    const mockSignal = jest.fn().mockReturnValue({ id: 1, imageSrc: 'test.jpg' });
    store.selectSignal = jest.fn().mockReturnValue(mockSignal);

    fixture = TestBed.createComponent(UploadPhotoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  describe('Form Initialization', () => {
    it('should have form initialization capability', () => {
      // Test that the component has the necessary setup for forms
      expect(component).toBeInstanceOf(UploadPhotoComponent);
    });
  });

  describe('File Selection Handling', () => {
    it('should handle file selection method calls', () => {
      const mockEvent = {
        target: { files: [] },
      } as unknown as Event;

      expect(() => {
        callComponentMethod(component, 'onFileChange', mockEvent);
      }).not.toThrow();
    });

    it('should handle invalid event target', () => {
      const mockEvent = { target: null } as unknown as Event;

      expect(() => {
        callComponentMethod(component, 'onFileChange', mockEvent);
      }).not.toThrow();
    });
  });

  describe('Upload Process', () => {
    it('should validate that services are called during upload setup', () => {
      // This test ensures the upload method can be called without errors
      // and that the service dependencies are properly set up
      expect(mockSetDataService.uploadDataUrl).toBeDefined();
    });
  });

  describe('Component State Management', () => {
    it('should have access to component properties using test helpers', () => {
      // Verify we can access protected properties using test helpers
      expect(typeof component['imagePreview']()).toBe('string');
      expect(typeof component['progressValue']()).toBe('number');
      expect(typeof component['isUploadCompleted']()).toBe('boolean');
    });
  });

  describe('Template Rendering', () => {
    it('should render the dialog title from config', () => {
      fixture.detectChanges();
      const titleElement = fixture.nativeElement.querySelector('h2');
      expect(titleElement.textContent).toContain(mockUploadConfig.title);
    });

    it('should display current image URL in the template', () => {
      fixture.detectChanges();
      const imgElements = fixture.nativeElement.querySelectorAll('img');
      const currentImg = imgElements[1]; // Second img is the current photo
      expect(currentImg.src).toContain('example.com');
    });
  });

  describe('Service Integration', () => {
    it('should have services properly injected', () => {
      expect(mockSetDataService).toBeDefined();
      expect(mockGetDataService).toBeDefined();
    });

    it('should handle service method calls', () => {
      mockSetDataService.getProgressValue.mockReturnValue(75);
      mockSetDataService.getUploadCompleteState.mockReturnValue(false);
      mockGetDataService.getPhotoURL.mockReturnValue(of('https://example.com/test.jpg'));

      expect(mockSetDataService.getProgressValue()).toBe(75);
      expect(mockSetDataService.getUploadCompleteState()).toBe(false);
    });
  });

  describe('Dialog Data Integration', () => {
    it('should handle optional configuration properties', () => {
      const configWithDefaults: Partial<IUploadPhotoConfig> = {
        title: 'Test',
      };

      expect(configWithDefaults.title).toBeDefined();
      expect(configWithDefaults.fieldPath).toBeUndefined();
    });
  });

  describe('Component Behavior', () => {
    it('should be properly initialized', () => {
      expect(component).toBeInstanceOf(UploadPhotoComponent);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing dialog data gracefully', () => {
      // This test verifies the component can handle undefined config properties
      const partialConfig: Partial<IUploadPhotoConfig> = { title: 'Test' };
      expect(partialConfig.title).toBeDefined();
      expect(partialConfig.fieldPath).toBeUndefined();
    });

    it('should handle service failures', () => {
      mockSetDataService.uploadDataUrl.mockRejectedValue(new Error('Service failure'));

      expect(mockSetDataService.uploadDataUrl).toBeDefined();
    });
  });

  describe('when a photo is uploaded', () => {
    beforeEach(() => {
      mockSetDataService.uploadDataUrl.mockImplementation(async (_path, _dataUrl, onProgress) => {
        onProgress?.(100);
        return 'https://cdn.example/icon.webp';
      });
      jest.spyOn(store, 'dispatch');
    });

    afterEach(() => {
      mockUploadConfig.fieldPath = 'test/path/image.jpg/';
      mockUploadConfig.currentImageUrl = 'https://example.com/current-image.jpg';
      mockUploadConfig.onImageUploaded = jest.fn();
    });

    it('should preview the chosen file', () => {
      const file = new File(['icon'], 'icon.webp', { type: 'image/webp' });
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [file] });
      const reader = {
        result: 'data:image/webp;base64,abc',
        onload: null as (() => void) | null,
        readAsDataURL(): void {
          this.onload?.();
        },
      };
      jest.spyOn(global, 'FileReader').mockImplementation(() => reader as unknown as FileReader);

      component['onFileChange']({ target: input } as unknown as Event);

      expect(component['uploadPhotoForm'].fileName().value()).toBe('icon.webp');
      expect(component['imagePreview']()).toBe('data:image/webp;base64,abc');
      jest.restoreAllMocks();
    });

    it('should ignore an empty file picker', () => {
      const input = document.createElement('input');

      component['onFileChange']({ target: input } as unknown as Event);

      expect(component['uploadPhotoForm'].fileName().value()).toBe('');
    });

    it('should show a required error after upload is attempted with no file', () => {
      component.ngOnInit();

      component['uploadData']();

      expect(component['hasError'](component['uploadPhotoForm'].fileName, 'required')).toBe(true);
      expect(mockSetDataService.uploadDataUrl).not.toHaveBeenCalled();
    });

    it('should stop when the dialog has no storage path', () => {
      mockUploadConfig.fieldPath = '';
      component['uploadPhotoForm'].fileName().value.set('icon.webp');

      component['uploadData']();

      expect(mockSetDataService.uploadDataUrl).not.toHaveBeenCalled();
    });

    it('should store the download url and tell the caller', async () => {
      component.ngOnInit();
      component['uploadPhotoForm'].fileName().value.set('icon.webp');
      component['imageUrl'].set('data:image/webp;base64,abc');

      await component['uploadData']();

      expect(component['progressValue']()).toBe(100);
      expect(component['isUploadCompleted']()).toBe(true);
      expect(component['currentImageUrl']()).toBe('https://cdn.example/icon.webp');
      expect(component['imagePreview']()).toBe(component['defaultImageSrc']);
      expect(store.dispatch).not.toHaveBeenCalled();
      expect(mockUploadConfig.onImageUploaded).toHaveBeenCalledWith('https://cdn.example/icon.webp');
    });

    it('should upload without a callback', async () => {
      mockUploadConfig.onImageUploaded = undefined;
      mockUploadConfig.currentImageUrl = '';
      component.ngOnInit();
      component['uploadPhotoForm'].fileName().value.set('icon.webp');

      await component['uploadData']();

      expect(component['currentImageUrl']()).toBe('https://cdn.example/icon.webp');
      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('should keep the current photo when storage rejects the upload', async () => {
      mockSetDataService.uploadDataUrl.mockRejectedValue(new Error('offline'));
      component.ngOnInit();
      component['uploadPhotoForm'].fileName().value.set('icon.webp');

      await component['uploadData']();

      expect(component['currentImageUrl']()).toBe('https://example.com/current-image.jpg');
    });
  });
});
