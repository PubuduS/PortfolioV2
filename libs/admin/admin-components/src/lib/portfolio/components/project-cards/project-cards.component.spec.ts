import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { StateActions } from '@portfolio-v2/state';
import { IProjectCard } from '@portfolio-v2/state/dataModels';
import {
  GetDataService,
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { spyOnMethod } from '@portfolio-v2/shared/test-helpers';
import {
  ProjectCardType,
  UploadPhotoComponent,
} from '@portfolio-v2/admin/shared/components';
import { PortfolioWriter } from '../../services/portfolio-writer.service';
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
  let writer: jest.Mocked<PortfolioWriter>;
  let utilityService: jest.Mocked<UtilityService>;
  let store: MockStore;

  const mockProjectData = {
    cardId: mockProjectCard.id,
    type: ProjectCardType.standard,
  };

  beforeEach(async () => {
    getDataService = createSpyObj(GetDataService);
    setDataService = createSpyObj(SetDataService);
    writer = createSpyObj(PortfolioWriter);
    writer.saveCard.mockResolvedValue(undefined);
    utilityService = createSpyObj(UtilityService);

    await TestBed.configureTestingModule({
      imports: [ProjectCardsComponent],
      providers: [
        provideMockStore({
          initialState: {
            stateBanks: {
              projectCards: [mockProjectCard],
              featuredProjectCards: [mockProjectCard],
              selectedProjectCardID: 1,
            },
          },
        }),
        { provide: MAT_DIALOG_DATA, useValue: mockProjectData },
        { provide: GetDataService, useValue: getDataService },
        { provide: SetDataService, useValue: setDataService },
        { provide: PortfolioWriter, useValue: writer },
        { provide: UtilityService, useValue: utilityService },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    jest.spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(ProjectCardsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  describe('Component Initialization', () => {
    it('should initialize form with project card data', () => {
      component.ngOnInit();

      const form = component['cardEditorForm'];
      expect(form).toBeDefined();
      expect(form.description().value()).toBe(mockProjectCard.description);
      expect(form.technologies().value()).toBe(mockProjectCard.tools);
      expect(form.codebase().value()).toBe(mockProjectCard.githubURL);
      expect(form.youtube().value()).toBe(mockProjectCard.demoURL);
      expect(form.screenshot().value()).toBe(mockProjectCard.screenshotURL);
      expect(form.documentation().value()).toBe(mockProjectCard.documentationURL);
    });

    it('should open the project-card listener when the dialog opens', () => {
      expect(store.dispatch).toHaveBeenCalledWith(StateActions.projectCardsStateConnect());
    });

    it('should set up form validators correctly', () => {
      component.ngOnInit();

      const form = component['cardEditorForm'];
      const descriptionControl = form.description();
      const codebaseControl = form.codebase();
      const screenshotControl = form.screenshot();

      descriptionControl.value.set('');
      expect(descriptionControl.valid()).toBeFalsy();

      descriptionControl.value.set('Valid description');
      expect(descriptionControl.valid()).toBeTruthy();

      codebaseControl.value.set('');
      expect(codebaseControl.valid()).toBeTruthy();

      screenshotControl.value.set('');
      expect(screenshotControl.valid()).toBeTruthy();

      codebaseControl.value.set('https://github.com/user/repo');
      expect(codebaseControl.valid()).toBeTruthy();

      screenshotControl.value.set('https://firebase.com/image.jpg');
      expect(screenshotControl.valid()).toBeTruthy();
    });
  });

  describe('File Selection', () => {
    let originalFileReader: typeof FileReader;

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
      } as unknown as Event;

      // Just test that the method doesn't throw errors
      expect(() => {
        component['onFileSelected'](mockEvent);
      }).not.toThrow();
    });

    it('should handle empty file selection', () => {
      const mockEvent = {
        target: { files: [] },
      } as unknown as Event;

      expect(() => {
        component['onFileSelected'](mockEvent);
      }).not.toThrow();
    });
  });

  describe('Photo Upload Dialog', () => {
    it('should open upload photo dialog with correct configuration', () => {
      jest.spyOn(utilityService, 'getPaddedDigits').mockReturnValue('01');
      const dialogSpy = jest.spyOn(component['dialog'], 'open');

      component['openUploadPhotoPanel']();

      expect(dialogSpy).toHaveBeenCalledWith(
        UploadPhotoComponent,
        expect.objectContaining({
          autoFocus: 'first-tabbable',
          restoreFocus: true,
          data: expect.objectContaining({
            title: 'Upload Project Screenshot',
            fieldPath: expect.stringContaining('01'),
            currentImageUrl: mockProjectCard.screenshotURL,
            onImageUploaded: expect.any(Function),
          }),
        }),
      );
    });

    it('should call utility service for ID padding', () => {
      jest.spyOn(utilityService, 'getPaddedDigits').mockReturnValue('01');

      component['openUploadPhotoPanel']();

      expect(utilityService.getPaddedDigits).toHaveBeenCalledWith(1, 2);
    });

    it('should configure onImageUploaded callback', () => {
      component.ngOnInit(); // Ensure form is initialized
      const dialogSpy = jest.spyOn(component['dialog'], 'open');

      component['openUploadPhotoPanel']();

      const callArgs = dialogSpy.mock.calls[0][1] as {
        data: { onImageUploaded: (url: string) => void };
      };
      const { onImageUploaded } = callArgs.data;

      expect(typeof onImageUploaded).toBe('function');

      // Test that the callback function exists and is properly configured
      expect(onImageUploaded).toBeDefined();
    });
  });

  describe('Data Update Functionality', () => {
    beforeEach(() => {
      component.ngOnInit();
      writer.saveCard.mockResolvedValue(undefined);
      jest.spyOn(setDataService, 'uploadDataUrl').mockImplementation(async (_path, _dataUrl, onProgress) => {
        onProgress?.(100);
        return 'uploaded-url';
      });
    });

    it('should not update data when form is invalid', () => {
      const form = component['cardEditorForm'];
      form.description().value.set('');

      component['updateData']();

      expect(writer.saveCard).not.toHaveBeenCalled();
    });

    it('should update project card data when form is valid', () => {
      component['updateData']();

      expect(writer.saveCard).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockProjectCard.id,
          description: mockProjectCard.description,
          tools: mockProjectCard.tools,
          githubURL: mockProjectCard.githubURL,
          demoURL: mockProjectCard.demoURL,
          screenshotURL: mockProjectCard.screenshotURL,
          documentationURL: mockProjectCard.documentationURL,
        }),
        false,
      );
    });

    it('should handle file upload when new image is selected', () => {
      // Simulate that a file was selected and processed
      component['imageUrl'].set('data:image/jpeg;base64,newimage');

      const handleFileUploadSpy = spyOnMethod(component, 'handleFileUpload');

      component['updateData']();

      // The method should detect the new image and call handleFileUpload
      expect(handleFileUploadSpy).toHaveBeenCalled();
      expect(setDataService.uploadDataUrl).toHaveBeenCalled();
    });

    it('should set correct disable flags based on URL presence', () => {
      const form = component['cardEditorForm'];
      form.codebase().value.set('https://github.com/user/repo');
      form.youtube().value.set('');
      form.screenshot().value.set('https://firebase.com/image.jpg');
      form.documentation().value.set('');

      component['updateData']();

      expect(writer.saveCard).toHaveBeenCalledWith(
        expect.objectContaining({
          gitDisable: false,
          demoDisable: true,
          ssDisable: false,
          docDisable: true,
        }),
        false,
      );
    });

    it('should call saveCard to update project card data', () => {
      component['updateData']();

      expect(writer.saveCard).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockProjectCard.id,
          description: mockProjectCard.description,
          tools: mockProjectCard.tools,
        }),
        false,
      );
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

      const form = component['cardEditorForm'];
      form.description().value.set('');
      form.description().markAsTouched();
      fixture.detectChanges();

      const errorElements = fixture.nativeElement.querySelectorAll('.field-error');
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  describe('Service Integration', () => {
    it('should handle successful file upload to storage', async () => {
      component['imageUrl'].set('test-image-data');

      jest.spyOn(setDataService, 'uploadDataUrl').mockResolvedValue('firebase-url');

      component['handleFileUpload']('test/path');
      await Promise.resolve();

      expect(setDataService.uploadDataUrl).toHaveBeenCalledWith(
        'test/path',
        'test-image-data',
        expect.any(Function),
      );
      expect(component['imageUrl']()).toBe('firebase-url');
    });

    it('should save the card through the portfolio writer', () => {
      const testCard: IProjectCard = { ...mockProjectCard };
      writer.saveCard.mockResolvedValue(undefined);

      component['saveDataRecord'](testCard);

      expect(writer.saveCard).toHaveBeenCalledWith(testCard, false);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      component.ngOnInit(); // Ensure form is initialized for error tests
    });

    it('should handle file selection with no files', () => {
      const mockEvent = {
        target: { files: [] },
      } as unknown as Event;

      expect(() => {
        component['onFileSelected'](mockEvent);
      }).not.toThrow();
    });

    it('should handle invalid event target', () => {
      const mockEvent = { target: null } as unknown as Event;

      expect(() => {
        component['onFileSelected'](mockEvent);
      }).not.toThrow();
    });

    it('should handle service failures gracefully', () => {
      writer.saveCard.mockRejectedValue(new Error('offline'));

      expect(() => {
        component['updateData']();
      }).not.toThrow();

      expect(writer.saveCard).toHaveBeenCalled();
    });
  });

  describe('Featured Project Support', () => {
    let featuredComponent: ProjectCardsComponent;
    let featuredFixture: ComponentFixture<ProjectCardsComponent>;
    let featuredStore: MockStore;

    const mockFeaturedProjectData = {
      cardId: mockProjectCard.id,
      type: ProjectCardType.featured,
    };

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ProjectCardsComponent],
        providers: [
          provideMockStore({
            initialState: {
              stateBanks: {
                projectCards: [mockProjectCard],
                featuredProjectCards: [mockProjectCard],
                selectedProjectCardID: 1,
              },
            },
          }),
          { provide: MAT_DIALOG_DATA, useValue: mockFeaturedProjectData },
          { provide: GetDataService, useValue: getDataService },
          { provide: SetDataService, useValue: setDataService },
        { provide: PortfolioWriter, useValue: writer },
          { provide: UtilityService, useValue: utilityService },
        ],
      }).compileComponents();

      featuredStore = TestBed.inject(MockStore);
      jest.spyOn(featuredStore, 'dispatch');
      featuredFixture = TestBed.createComponent(ProjectCardsComponent);
      featuredComponent = featuredFixture.componentInstance;
      await featuredFixture.whenStable();
    });

    it('should open the featured-project listener when the dialog opens', () => {
      expect(featuredStore.dispatch).toHaveBeenCalledWith(
        StateActions.featuredProjectCardsStateConnect(),
      );
    });

    it('should initialize with featured project data', () => {
      expect(featuredComponent.data.type).toBe(ProjectCardType.featured);
      expect(featuredComponent.data.cardId).toBe(mockProjectCard.id);
    });

    it('should select featured project card from store', () => {
      // The constructor should select the featured project card
      expect(featuredComponent['projectCard']()).toBeDefined();
    });

    it('should initialize form with featured project card data', () => {
      featuredComponent.ngOnInit();

      expect(featuredComponent['cardEditorForm']).toBeDefined();
      expect(featuredComponent['cardEditorForm'].description().value()).toBe(mockProjectCard.description);
      expect(featuredComponent['cardEditorForm'].technologies().value()).toBe(mockProjectCard.tools);
    });
  });
});

describe('ProjectCardsComponent when the card arrives after the dialog opens', () => {
  let fixture: ComponentFixture<ProjectCardsComponent>;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCardsComponent],
      providers: [
        provideMockStore({
          initialState: {
            stateBanks: {
              projectCards: [],
              featuredProjectCards: [],
              selectedProjectCardID: 1,
            },
          },
        }),
        {
          provide: MAT_DIALOG_DATA,
          useValue: { cardId: mockProjectCard.id, type: ProjectCardType.standard },
        },
        { provide: GetDataService, useValue: createSpyObj(GetDataService) },
        { provide: SetDataService, useValue: createSpyObj(SetDataService) },
        { provide: PortfolioWriter, useValue: createSpyObj(PortfolioWriter) },
        { provide: UtilityService, useValue: createSpyObj(UtilityService) },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(ProjectCardsComponent);
    fixture.detectChanges();
  });

  it('should fill the editor from the first stored card', () => {
    expect(fixture.componentInstance['cardEditorForm'].description().value()).toBe('');

    store.setState({
      stateBanks: {
        projectCards: [mockProjectCard],
        featuredProjectCards: [],
        selectedProjectCardID: 1,
      },
    });
    fixture.detectChanges();

    expect(fixture.componentInstance['cardEditorForm'].description().value()).toBe(
      mockProjectCard.description,
    );
    expect(fixture.componentInstance['cardEditorForm'].codebase().value()).toBe(
      mockProjectCard.githubURL,
    );
  });
});
