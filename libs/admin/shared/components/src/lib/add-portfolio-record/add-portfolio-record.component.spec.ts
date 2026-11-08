import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';

import { fieldHasError } from '@portfolio-v2/shared/forms';
import { StateActions } from '@portfolio-v2/state';
import { IProjectView } from '@portfolio-v2/state/dataModels';
import {
  GetDataService,
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { portfolioCardsSelector } from '@portfolio-v2/state/selectors';
import {
  UploadPhotoComponent,
  ProjectCardType,
} from '@portfolio-v2/admin/shared/components';
import { AddPortfolioRecordComponent } from './add-portfolio-record.component';

describe('AddPortfolioRecordComponent', () => {
  // Mock data for tests
  const mockData: IProjectView[] = [
    {
      id: 1,
      imageURL: 'https://example.com/image1.jpg',
      viewHeading: 'Project 1',
      viewDescription: 'Description for project 1',
    },
  ];
  let component: AddPortfolioRecordComponent;
  let fixture: ComponentFixture<AddPortfolioRecordComponent>;
  let store: MockStore;
  let mockSetDataService: jest.Mocked<SetDataService>;
  let mockGetDataService: jest.Mocked<GetDataService>;
  let mockUtilityService: jest.Mocked<UtilityService>;

  beforeEach(async () => {
    mockSetDataService = createSpyObj(SetDataService);
    mockGetDataService = createSpyObj(GetDataService);
    mockUtilityService = createSpyObj(UtilityService);

    await TestBed.configureTestingModule({
      imports: [
        AddPortfolioRecordComponent,
        MockComponents(UploadPhotoComponent),
      ],
      providers: [
        provideMockStore({}),
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            currentId: 1,
            heading: 'Test Project',
            type: ProjectCardType.standard,
          },
        },
        { provide: SetDataService, useValue: mockSetDataService },
        { provide: GetDataService, useValue: mockGetDataService },
        { provide: UtilityService, useValue: mockUtilityService },
        { provide: MatDialogRef, useValue: createSpyObj(MatDialogRef.name, ['close']) },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(portfolioCardsSelector, mockData);
    store.refreshState();

    fixture = TestBed.createComponent(AddPortfolioRecordComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  describe('Component Initialization', () => {
    it('should initialize with correct dialog data', () => {
      expect(component.data.currentId).toBe(1);
      expect(component.data.heading).toBe('Test Project');
      expect(component.data.type).toBe(ProjectCardType.standard);
    });

    it('should initialize form on ngOnInit for standard projects', () => {
      component['ngOnInit']();

      expect(component['cardAddForm']).toBeDefined();
      expect(component['cardAddForm'].description()).toBeDefined();
      expect(component['cardAddForm'].technologies()).toBeDefined();
      expect(component['cardAddForm'].codebase()).toBeDefined();
      expect(component['cardAddForm'].youtube()).toBeDefined();
      expect(component['cardAddForm'].screenshot()).toBeDefined();
      expect(component['cardAddForm'].documentation()).toBeDefined();
    });

    it('should initialize form on ngOnInit for featured projects', () => {
      // Override the data for featured project test
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddPortfolioRecordComponent],
        providers: [
          provideMockStore({}),
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              currentId: 2,
              heading: 'Featured Project',
              type: ProjectCardType.featured,
            },
          },
          { provide: SetDataService, useValue: mockSetDataService },
          { provide: GetDataService, useValue: mockGetDataService },
          { provide: UtilityService, useValue: mockUtilityService },
          { provide: MatDialogRef, useValue: createSpyObj(MatDialogRef.name, ['close']) },
        ],
      }).compileComponents();

      const featuredFixture = TestBed.createComponent(AddPortfolioRecordComponent);
      const featuredComponent = featuredFixture.componentInstance;

      featuredComponent['ngOnInit']();

      expect(featuredComponent['cardAddForm']).toBeDefined();
      expect(featuredComponent['cardAddForm'].heading()).toBeDefined();
      expect(featuredComponent['cardAddForm'].description()).toBeDefined();
    });
  });

  describe('openUploadPhotoPanel', () => {
    it('should open upload dialog with correct path for standard projects', () => {
      const dialogSpy = jest.spyOn(component['dialog'], 'open');
      mockUtilityService.getPaddedDigits.mockReturnValue('01');

      component['openUploadPhotoPanel']();

      expect(dialogSpy).toHaveBeenCalledWith(
        UploadPhotoComponent,
        expect.objectContaining({
          data: expect.objectContaining({
            fieldPath: 'portfolio/project-screenshots/normal/ID-01-Screenshot.webp/',
          }),
        }),
      );
    });

    it('should open upload dialog with correct path for featured projects', () => {
      // Test with featured project data
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddPortfolioRecordComponent],
        providers: [
          provideMockStore({}),
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              currentId: 2,
              heading: 'Featured Project',
              type: ProjectCardType.featured,
            },
          },
          { provide: SetDataService, useValue: mockSetDataService },
          { provide: GetDataService, useValue: mockGetDataService },
          { provide: UtilityService, useValue: mockUtilityService },
          { provide: MatDialogRef, useValue: createSpyObj(MatDialogRef.name, ['close']) },
        ],
      }).compileComponents();

      const featuredFixture = TestBed.createComponent(AddPortfolioRecordComponent);
      const featuredComponent = featuredFixture.componentInstance;
      const dialogSpy = jest.spyOn(featuredComponent['dialog'], 'open');
      mockUtilityService.getPaddedDigits.mockReturnValue('02');

      featuredComponent['openUploadPhotoPanel']();

      expect(dialogSpy).toHaveBeenCalledWith(
        UploadPhotoComponent,
        expect.objectContaining({
          data: expect.objectContaining({
            fieldPath: 'portfolio/project-screenshots/normal/ID-02-Screenshot.webp/',
          }),
        }),
      );
    });
  });

  describe('addData', () => {
    beforeEach(() => {
      component.ngOnInit();
      mockSetDataService.setRecord.mockReturnValue(of('successfull'));
      mockUtilityService.getPaddedDigits.mockReturnValue('01');
    });

    it('should not submit if form is invalid', async () => {
      component['cardAddForm'].description().value.set('');

      await component['addData']?.();

      expect(mockSetDataService.setRecord).not.toHaveBeenCalled();
    });

    it('should submit form data for standard projects', async () => {
      component['cardAddForm'].description().value.set('Test description');
      component['cardAddForm'].technologies().value.set('Angular, TypeScript');
      component['cardAddForm'].codebase().value.set('https://github.com/test');
      component['cardAddForm'].youtube().value.set('https://youtube.com/test');
      component['cardAddForm'].screenshot().value.set('https://example.com/screenshot.jpg');
      component['cardAddForm'].documentation().value.set('https://docs.com');

      await component['addData']?.();

      expect(mockSetDataService.setRecord).toHaveBeenCalledWith(
        'project-data-section/project-01/',
        expect.objectContaining({
          id: 1,
          heading: 'Test Project',
          description: 'Test description',
          tools: 'Angular, TypeScript',
          imageURL: 'https://placehold.co/300x200.png', // Default since no file uploaded
        }),
      );
    });

    it('should handle file upload for standard projects', async () => {
      // Mock successful file upload
      const mockUploadMethod = jest.fn().mockResolvedValue('https://firebase.com/uploaded-image.jpg');
      component['uploadFileAndGetUrl'] = mockUploadMethod;

      // Set imageUrl to simulate file selection
      component['imageUrl'].set('data:image/webp;base64,testdata');

      component['cardAddForm'].description().value.set('Test description');
      component['cardAddForm'].technologies().value.set('Angular, TypeScript');

      await component['addData']?.();

      expect(mockUploadMethod).toHaveBeenCalledWith('portfolio/project-card-images/ID-01-Image.webp/');
      expect(mockSetDataService.setRecord).toHaveBeenCalledWith(
        'project-data-section/project-01/',
        expect.objectContaining({
          imageURL: 'https://firebase.com/uploaded-image.jpg',
        }),
      );
    });

    it('should handle file upload for featured projects', async () => {
      // Create component with featured project type
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddPortfolioRecordComponent],
        providers: [
          provideMockStore({}),
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              currentId: 2,
              heading: 'Featured Project',
              type: ProjectCardType.featured,
            },
          },
          { provide: SetDataService, useValue: mockSetDataService },
          { provide: GetDataService, useValue: mockGetDataService },
          { provide: UtilityService, useValue: mockUtilityService },
          { provide: MatDialogRef, useValue: createSpyObj(MatDialogRef.name, ['close']) },
        ],
      }).compileComponents();

      const featuredFixture = TestBed.createComponent(AddPortfolioRecordComponent);
      const featuredComponent = featuredFixture.componentInstance;

      featuredComponent.ngOnInit();
      mockUtilityService.getPaddedDigits.mockReturnValue('02');

      // Mock successful file upload
      const mockUploadMethod = jest.fn().mockResolvedValue('https://firebase.com/featured-image.jpg');
      featuredComponent['uploadFileAndGetUrl'] = mockUploadMethod;
      featuredComponent['imageUrl'].set('data:image/webp;base64,testdata');

      featuredComponent['cardAddForm'].heading().value.set('Featured Test');
      featuredComponent['cardAddForm'].description().value.set('Featured description');
      featuredComponent['cardAddForm'].technologies().value.set('React, Node.js');

      await featuredComponent['addData']?.();

      expect(mockUploadMethod).toHaveBeenCalledWith('portfolio/featured-projects/ID-02-Image.webp/');
      expect(mockSetDataService.setRecord).toHaveBeenCalledWith(
        'featured-project-section/project-02/',
        expect.objectContaining({
          heading: 'Featured Test',
          imageURL: 'https://firebase.com/featured-image.jpg',
        }),
      );
    });

    it('should disable empty links and refresh the standard cards', async () => {
      component['cardAddForm'].description().value.set('Test description');
      component['cardAddForm'].technologies().value.set('Angular');
      jest.spyOn(store, 'dispatch');

      await component['addData']();
      let saved = false;
      component['isEditSuccess'].subscribe((value) => {
        saved = value;
      });

      expect(saved).toBe(true);
      expect(mockSetDataService.setRecord).toHaveBeenCalledWith(
        'project-data-section/project-01/',
        expect.objectContaining({
          gitDisable: true,
          demoDisable: true,
          ssDisable: true,
          docDisable: true,
        }),
      );
      expect(store.dispatch).toHaveBeenCalledWith(StateActions.portfolioCardsStateConnect());
      expect(store.dispatch).toHaveBeenCalledWith(StateActions.projectCardsStateConnect());
      expect(component['imagePreview']()).toBe(component['defaultImageSrc']);
    });

    it('should keep the placeholder when the upload fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      component['uploadFileAndGetUrl'] = jest.fn().mockRejectedValue(new Error('offline'));
      component['imageUrl'].set('data:image/webp;base64,abc');
      component['cardAddForm'].description().value.set('Test description');
      component['cardAddForm'].technologies().value.set('Angular');

      await component['addData']();

      expect(mockSetDataService.setRecord).toHaveBeenCalledWith(
        'project-data-section/project-01/',
        expect.objectContaining({ imageURL: component['defaultImageSrc'] }),
      );
    });

    it('should leave the preview when the record is not stored', async () => {
      mockSetDataService.setRecord.mockReturnValue(of('failed'));
      component['imagePreview'].set('data:image/webp;base64,abc');
      component['cardAddForm'].description().value.set('Test description');
      component['cardAddForm'].technologies().value.set('Angular');

      await component['addData']();
      let saved = true;
      component['isEditSuccess'].subscribe((value) => {
        saved = value;
      });

      expect(saved).toBe(false);
      expect(component['imagePreview']()).toBe('data:image/webp;base64,abc');
    });
  });

  describe('when a screenshot is chosen', () => {
    beforeEach(() => {
      mockUtilityService.getPaddedDigits.mockReturnValue('01');
      component.ngOnInit();
    });

    it('should show a required error only after the field is touched', () => {
      const {description} = component['cardAddForm'];

      expect(fieldHasError(description, 'required')).toBe(false);

      description().markAsTouched();

      expect(fieldHasError(description, 'required')).toBe(true);
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

      component['onFileSelected']({ target: input } as unknown as Event);

      expect(component['imagePreview']()).toBe('data:image/webp;base64,abc');
      jest.restoreAllMocks();
    });

    it('should ignore an empty file picker', () => {
      component['onFileSelected']({ target: document.createElement('input') } as unknown as Event);

      expect(component['imageUrl']()).toBe('');
    });

    it('should write the screenshot url back onto a standard card', () => {
      const open = jest.spyOn(component['dialog'], 'open');

      component['openUploadPhotoPanel']();
      const data = open.mock.calls[0][1]?.data as {
        onImageUploaded: (imageUrl: string) => void;
      };
      data.onImageUploaded('https://cdn.example/shot.webp');

      expect(component['cardAddForm'].screenshot().value()).toBe('https://cdn.example/shot.webp');
    });
  });

  describe('when the image upload runs', () => {
    beforeEach(() => {
      mockSetDataService.uploadDataUrl.mockImplementation(async (_path, _dataUrl, onProgress) => {
        onProgress?.(55);
        return 'https://cdn.example/card.webp';
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should resolve with the download url', async () => {
      await expect(
        component['uploadFileAndGetUrl']('portfolio/project-card-images/ID-01-Image.webp/'),
      ).resolves.toBe('https://cdn.example/card.webp');
      expect(component['progressValue']()).toBe(55);
      expect(component['imageUrl']()).toBe('https://cdn.example/card.webp');
    });

    it('should reject when the upload fails', async () => {
      mockSetDataService.uploadDataUrl.mockRejectedValue(new Error('storage down'));

      await expect(component['uploadFileAndGetUrl']('path')).rejects.toThrow('storage down');
    });

    it('should reject when storage does not finish', async () => {
      jest.useFakeTimers();
      mockSetDataService.uploadDataUrl.mockImplementation(() => new Promise(() => {
        // The upload never finishes, so the dialog timeout wins.
      }));
      const pending = component['uploadFileAndGetUrl']('path');
      const failed = expect(pending).rejects.toThrow('Upload timeout');

      await jest.advanceTimersByTimeAsync(30000);

      await failed;
    });

    it('should clear a pending upload timeout on destroy', () => {
      component['uploadTimeoutId'] = 5;
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      component.ngOnDestroy();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(5);
      clearTimeoutSpy.mockRestore();
    });

    it('should destroy cleanly when nothing is in flight', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('when the card is featured', () => {
    let featured: AddPortfolioRecordComponent;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [AddPortfolioRecordComponent],
        providers: [
          provideMockStore({}),
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              currentId: 2,
              heading: 'Featured Project',
              type: ProjectCardType.featured,
            },
          },
          { provide: SetDataService, useValue: mockSetDataService },
          { provide: GetDataService, useValue: mockGetDataService },
          { provide: UtilityService, useValue: mockUtilityService },
          { provide: MatDialogRef, useValue: createSpyObj(MatDialogRef.name, ['close']) },
        ],
      }).compileComponents();
      store = TestBed.inject(MockStore);
      store.overrideSelector(portfolioCardsSelector, mockData);
      store.refreshState();
      featured = TestBed.createComponent(AddPortfolioRecordComponent).componentInstance;
      featured.ngOnInit();
      mockUtilityService.getPaddedDigits.mockReturnValue('02');
      mockSetDataService.setRecord.mockReturnValue(of('successfull'));
    });

    it('should refresh the featured cards after a save', async () => {
      featured['cardAddForm'].heading().value.set('Featured Test');
      featured['cardAddForm'].description().value.set('Featured description');
      featured['cardAddForm'].technologies().value.set('Angular');
      jest.spyOn(store, 'dispatch');

      await featured['addData']();
      let saved = false;
      featured['isEditSuccess'].subscribe((value) => {
        saved = value;
      });

      expect(saved).toBe(true);
      expect(store.dispatch).toHaveBeenCalledWith(StateActions.featuredProjectCardsStateConnect());
    });

    it('should write the screenshot url onto the featured card form', () => {
      const open = jest.spyOn(featured['dialog'], 'open');

      featured['openUploadPhotoPanel']();
      const data = open.mock.calls[0][1]?.data as {
        onImageUploaded: (imageUrl: string) => void;
      };
      data.onImageUploaded('https://cdn.example/shot.webp');

      expect(featured['cardAddForm'].screenshot().value()).toBe('https://cdn.example/shot.webp');
    });
  });
});
