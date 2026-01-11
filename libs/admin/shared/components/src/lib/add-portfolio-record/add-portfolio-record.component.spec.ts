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

import { IProjectView } from '@portfolio-v2/state/dataModels';
import {
  GetDataService,
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { portfolioCardsSelector } from '@portfolio-v2/state/selectors';
import {
  DisplayValidatorErrorsComponent,
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
        MockComponents(
          DisplayValidatorErrorsComponent,
          UploadPhotoComponent,
        ),
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
      expect(component['cardAddForm']?.get('description')).toBeDefined();
      expect(component['cardAddForm']?.get('technologies')).toBeDefined();
      expect(component['cardAddForm']?.get('codebase')).toBeDefined();
      expect(component['cardAddForm']?.get('youtube')).toBeDefined();
      expect(component['cardAddForm']?.get('screenshot')).toBeDefined();
      expect(component['cardAddForm']?.get('documentation')).toBeDefined();
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
      expect(featuredComponent['cardAddForm']?.get('heading')).toBeDefined();
      expect(featuredComponent['cardAddForm'].get('description')).toBeDefined();
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
      component['cardAddForm']?.get('description')?.setValue(''); // Make form invalid

      await component['addData']?.();

      expect(mockSetDataService.setRecord).not.toHaveBeenCalled();
    });

    it('should submit form data for standard projects', async () => {
      component['cardAddForm']?.patchValue({
        description: 'Test description',
        technologies: 'Angular, TypeScript',
        codebase: 'https://github.com/test',
        youtube: 'https://youtube.com/test',
        screenshot: 'https://example.com/screenshot.jpg',
        documentation: 'https://docs.com',
      });

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
      component['imageUrl'] = 'data:image/webp;base64,testdata';

      component['cardAddForm']?.patchValue({
        description: 'Test description',
        technologies: 'Angular, TypeScript',
      });

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
      featuredComponent['imageUrl'] = 'data:image/webp;base64,testdata';

      featuredComponent['cardAddForm']?.patchValue({
        heading: 'Featured Test',
        description: 'Featured description',
        technologies: 'React, Node.js',
      });

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
  });
});
