import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';
import { MockComponents } from 'ng-mocks';

import { IProjectCard } from '@portfolio-v2/state/dataModels';
import {
  GetDataService,
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { DisplayValidatorErrorsComponent } from '@portfolio-v2/shared/components';
import { UploadPhotoComponent } from '@portfolio-v2/admin/shared/components';
import { ProjectCardsComponent } from './project-cards.component';

// Mock complete project card data
const mockProjectCard: IProjectCard = {
  id: 1,
  heading: 'Test Project',
  description: 'Test project description',
  tools: 'Angular, TypeScript',
  imageURL: 'https://example.com/image.jpg',
  githubURL: 'https://github.com/user/repo',
  demoURL: 'https://youtube.com/watch?v=test',
  screenshotURL: 'https://firebase.com/screenshot.jpg',
  documentationURL: 'https://docs.com/guide',
  gitDisable: false,
  demoDisable: false,
  ssDisable: false,
  docDisable: false,
};

describe('ProjectCardsComponent', () => {
  let component: ProjectCardsComponent;
  let fixture: ComponentFixture<ProjectCardsComponent>;
  let getDataService: jest.Mocked<GetDataService>;
  let setDataService: jest.Mocked<SetDataService>;
  let utilityService: jest.Mocked<UtilityService>;

  beforeEach(async () => {
    getDataService = createSpyObj(GetDataService);
    setDataService = createSpyObj(SetDataService);
    utilityService = createSpyObj(UtilityService);

    await TestBed.configureTestingModule({
      imports: [
        ProjectCardsComponent,
        MockComponents(
          DisplayValidatorErrorsComponent,
        ),
      ],
      providers: [
        provideMockStore({
          initialState: {
            stateBanks: {
              projectCards: [mockProjectCard],
              selectedProjectCardID: 1,
            },
          },
        }),
        { provide: GetDataService, useValue: getDataService },
        { provide: SetDataService, useValue: setDataService },
        { provide: UtilityService, useValue: utilityService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCardsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  describe('Component Initialization', () => {
    it('should initialize form with project card data', () => {
      component.ngOnInit();

      const form = (component as any).cardEditorForm;
      expect(form).toBeDefined();
      expect(form.get('description')?.value).toBe(mockProjectCard.description);
      expect(form.get('technologies')?.value).toBe(mockProjectCard.tools);
      expect(form.get('codebase')?.value).toBe(mockProjectCard.githubURL);
      expect(form.get('youtube')?.value).toBe(mockProjectCard.demoURL);
      expect(form.get('screenshot')?.value).toBe(mockProjectCard.screenshotURL);
      expect(form.get('documentation')?.value).toBe(mockProjectCard.documentationURL);
    });

    it('should set up form validators correctly', () => {
      component.ngOnInit();

      const form = (component as any).cardEditorForm;
      const descriptionControl = form.get('description');
      const codebaseControl = form.get('codebase');
      const screenshotControl = form.get('screenshot');

      // Required validator on description and technologies
      descriptionControl?.setValue('');
      expect(descriptionControl?.valid).toBeFalsy();

      descriptionControl?.setValue('Valid description');
      expect(descriptionControl?.valid).toBeTruthy();

      // URL validators allow empty values
      codebaseControl?.setValue('');
      expect(codebaseControl?.valid).toBeTruthy();

      screenshotControl?.setValue('');
      expect(screenshotControl?.valid).toBeTruthy();

      // Valid URLs should pass
      codebaseControl?.setValue('https://github.com/user/repo');
      expect(codebaseControl?.valid).toBeTruthy();

      screenshotControl?.setValue('https://firebase.com/image.jpg');
      expect(screenshotControl?.valid).toBeTruthy();
    });
  });

  describe('File Selection', () => {
    let originalFileReader: any;

    beforeEach(() => {
      originalFileReader = global.FileReader;
      component.ngOnInit(); // Initialize form for file selection tests
    });

    afterEach(() => {
      global.FileReader = originalFileReader;
    });

    it('should handle file selection without throwing errors', () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockEvent = {
        target: { files: [mockFile] },
      } as any;

      // Just test that the method doesn't throw errors
      expect(() => {
        (component as any).onFileSelected(mockEvent);
      }).not.toThrow();
    });

    it('should handle empty file selection', () => {
      const mockEvent = {
        target: { files: [] },
      } as any;

      expect(() => {
        (component as any).onFileSelected(mockEvent);
      }).not.toThrow();
    });
  });

  describe('Photo Upload Dialog', () => {
    it('should open upload photo dialog with correct configuration', () => {
      jest.spyOn(utilityService, 'getPaddedDigits').mockReturnValue('01');
      const dialogSpy = jest.spyOn((component as any).dialog, 'open');

      (component as any).openUploadPhotoPanel();

      expect(dialogSpy).toHaveBeenCalledWith(
        UploadPhotoComponent,
        expect.objectContaining({
          autoFocus: 'first-tabbable',
          restoreFocus: true,
          data: expect.objectContaining({
            title: 'Upload Project Screenshot',
            fieldPath: expect.stringContaining('01'),
            currentImageUrl: mockProjectCard.screenshotURL,
            stateUpdateAction: expect.any(Function),
            onImageUploaded: expect.any(Function),
          }),
        }),
      );
    });

    it('should call utility service for ID padding', () => {
      jest.spyOn(utilityService, 'getPaddedDigits').mockReturnValue('01');

      (component as any).openUploadPhotoPanel();

      expect(utilityService.getPaddedDigits).toHaveBeenCalledWith(1, 2);
    });

    it('should configure onImageUploaded callback', () => {
      component.ngOnInit(); // Ensure form is initialized
      const dialogSpy = jest.spyOn((component as any).dialog, 'open');

      (component as any).openUploadPhotoPanel();

      const callArgs = dialogSpy.mock.calls[0][1] as any;
      const { onImageUploaded } = callArgs.data;

      expect(typeof onImageUploaded).toBe('function');

      // Test that the callback function exists and is properly configured
      expect(onImageUploaded).toBeDefined();
    });
  });

  describe('Data Update Functionality', () => {
    beforeEach(() => {
      component.ngOnInit();
      jest.spyOn(setDataService, 'setRecord').mockReturnValue(of('successfull'));
      jest.spyOn(setDataService, 'pushFileToStorage').mockResolvedValue(undefined);
      jest.spyOn(setDataService, 'getProgressValue').mockReturnValue(100);
      jest.spyOn(setDataService, 'getUploadCompleteState').mockReturnValue(true);
      jest.spyOn(getDataService, 'getPhotoURL').mockReturnValue(of('uploaded-url'));
    });

    it('should not update data when form is invalid', () => {
      const form = (component as any).cardEditorForm;
      form.get('description')?.setValue(''); // Make form invalid

      (component as any).updateData();

      expect(setDataService.setRecord).not.toHaveBeenCalled();
    });

    it('should update project card data when form is valid', () => {
      (component as any).updateData();

      expect(setDataService.setRecord).toHaveBeenCalledWith(
        expect.stringContaining('project-data-section'),
        expect.objectContaining({
          id: mockProjectCard.id,
          description: mockProjectCard.description,
          tools: mockProjectCard.tools,
          githubURL: mockProjectCard.githubURL,
          demoURL: mockProjectCard.demoURL,
          screenshotURL: mockProjectCard.screenshotURL,
          documentationURL: mockProjectCard.documentationURL,
        }),
      );
    });

    it('should handle file upload when new image is selected', () => {
      // Simulate that a file was selected and processed
      (component as any).imageUrl = 'data:image/jpeg;base64,newimage';

      const handleFileUploadSpy = jest.spyOn(component as any, 'handleFileUpload');

      (component as any).updateData();

      // The method should detect the new image and call handleFileUpload
      expect(handleFileUploadSpy).toHaveBeenCalled();
      expect(setDataService.pushFileToStorage).toHaveBeenCalled();
    });

    it('should set correct disable flags based on URL presence', () => {
      const form = (component as any).cardEditorForm;
      form.patchValue({
        codebase: 'https://github.com/user/repo',
        youtube: '',
        screenshot: 'https://firebase.com/image.jpg',
        documentation: '',
      });

      (component as any).updateData();

      expect(setDataService.setRecord).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          gitDisable: false, // Has URL, so not disabled
          demoDisable: true, // Empty, so disabled
          ssDisable: false, // Has URL, so not disabled
          docDisable: true, // Empty, so disabled
        }),
      );
    });

    it('should call setRecord with updated project card data', () => {
      (component as any).updateData();

      expect(setDataService.setRecord).toHaveBeenCalledWith(
        expect.stringContaining('project-data-section'),
        expect.objectContaining({
          id: mockProjectCard.id,
          description: mockProjectCard.description,
          tools: mockProjectCard.tools,
        }),
      );
    });
  });

  describe('Component Lifecycle', () => {
    it('should unsubscribe from subscriptions on destroy', () => {
      const unsubscribeSpy = jest.fn();
      (component as any).imageUrlSubscription = { unsubscribe: unsubscribeSpy };

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should clear upload interval on destroy', () => {
      const clearIntervalSpy = jest.spyOn(window, 'clearInterval').mockImplementation(() => {});
      (component as any).uploadProgressIntervalId = 123;

      component.ngOnDestroy();

      expect(clearIntervalSpy).toHaveBeenCalledWith(123);
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Template Integration', () => {
    it('should render project card data in template', () => {
      fixture.detectChanges();

      const headingElement = fixture.nativeElement.querySelector('h1');
      expect(headingElement?.textContent).toContain(mockProjectCard.heading);
    });

    it('should render form fields with correct initial values', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const descriptionInput = fixture.nativeElement.querySelector('textarea[id="description"]');
      expect(descriptionInput?.value).toBe(mockProjectCard.description);
    });

    it('should display validation errors for invalid form fields', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const form = (component as any).cardEditorForm;
      form.get('description')?.setValue('');
      form.get('description')?.markAsTouched();
      fixture.detectChanges();

      // Check if validation error components are present
      const errorElements = fixture.nativeElement.querySelectorAll('portfolio-display-validator-errors');
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  describe('Service Integration', () => {
    it('should handle successful file upload to storage', () => {
      (component as any).imageUrl = 'test-image-data';

      jest.spyOn(setDataService, 'pushFileToStorage').mockResolvedValue(undefined);
      jest.spyOn(setDataService, 'getProgressValue').mockReturnValue(100);
      jest.spyOn(setDataService, 'getUploadCompleteState').mockReturnValue(true);
      jest.spyOn(getDataService, 'getPhotoURL').mockReturnValue(of('firebase-url'));

      (component as any).handleFileUpload('test/path');

      expect(setDataService.pushFileToStorage).toHaveBeenCalledWith('test/path', 'test-image-data');
      expect(getDataService.getPhotoURL).toHaveBeenCalledWith('test/path');
    });

    it('should handle SetDataService record saving', () => {
      const testCard: IProjectCard = { ...mockProjectCard };
      jest.spyOn(setDataService, 'setRecord').mockReturnValue(of('successfull'));

      (component as any).saveDataRecord('test/path', testCard);

      expect(setDataService.setRecord).toHaveBeenCalledWith('test/path', testCard);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      component.ngOnInit(); // Ensure form is initialized for error tests
    });

    it('should handle file selection with no files', () => {
      const mockEvent = {
        target: { files: [] },
      } as any;

      expect(() => {
        (component as any).onFileSelected(mockEvent);
      }).not.toThrow();
    });

    it('should handle invalid event target', () => {
      const mockEvent = { target: null } as any;

      expect(() => {
        (component as any).onFileSelected(mockEvent);
      }).not.toThrow();
    });

    it('should handle service failures gracefully', () => {
      jest.spyOn(setDataService, 'setRecord').mockReturnValue(of('error occurred'));

      expect(() => {
        (component as any).updateData();
      }).not.toThrow();

      // Should still complete without throwing
      expect(setDataService.setRecord).toHaveBeenCalled();
    });
  });
});
