import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  IProjectView,
  IProjectCard,
} from '@portfolio-v2/state/dataModels';
import {
  GetDataService,
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import {
  portfolioCardsSelector,
  projectCardSelector,
  newProjectRecordIdSelector,
} from '@portfolio-v2/state/selectors';
import { AddPortfolioRecordComponent } from '@portfolio-v2/admin/shared/components';
import { ProjectCardType } from '../types/project-cards-type.enum';
import { AddTileComponent } from './add-tile.component';

describe('AddTileComponent', () => {
  let component: AddTileComponent;
  let fixture: ComponentFixture<AddTileComponent>;
  let store: MockStore;
  let mockSetDataService: jest.Mocked<SetDataService>;
  let mockGetDataService: jest.Mocked<GetDataService>;
  let mockUtilityService: jest.Mocked<UtilityService>;

  // Mock data for tests
  const mockData: IProjectView[] = [
    {
      id: 2,
      imageURL: 'https://example.com/image1.jpg',
      viewHeading: 'Project 1',
      viewDescription: 'Description for project 1',
    },
  ];

  const mockProjectCard: IProjectCard = {
    id: 2,
    heading: 'Test Project',
    description: 'Test project description',
    tools: 'React, TypeScript',
    imageURL: 'https://example.com/test-image.jpg',
    githubURL: 'https://github.com/test',
    gitDisable: false,
    demoURL: 'https://demo.test.com',
    demoDisable: false,
    documentationURL: 'https://docs.test.com',
    docDisable: false,
    screenshotURL: 'https://screenshot.test.com',
    ssDisable: false,
  };

  beforeEach(async () => {
    mockSetDataService = createSpyObj(SetDataService);
    mockGetDataService = createSpyObj(GetDataService);
    mockUtilityService = createSpyObj(UtilityService);

    await TestBed.configureTestingModule({
      imports: [
        AddTileComponent,
        MockComponents(
          AddPortfolioRecordComponent,
        ),
      ],
      providers: [
        provideMockStore({}),
        { provide: SetDataService, useValue: mockSetDataService },
        { provide: GetDataService, useValue: mockGetDataService },
        { provide: UtilityService, useValue: mockUtilityService },
        { provide: MatDialogRef, useValue: createSpyObj(MatDialogRef.name, ['close']) },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);

    store.overrideSelector(portfolioCardsSelector, mockData);
    store.overrideSelector(projectCardSelector(2), mockProjectCard);
    store.overrideSelector(newProjectRecordIdSelector, 3);
    store.refreshState();

    fixture = TestBed.createComponent(AddTileComponent);
    component = fixture.componentInstance;

    component.ngOnInit(); // Initialize the component
    await fixture.whenStable();
  });

  describe('Component Initialization', () => {
    it('should initialize form on ngOnInit', () => {
      expect(component['tileEditorForm']).toBeDefined();
      expect(component['tileEditorForm'].get('title')).toBeDefined();
      expect(component['tileEditorForm'].get('description')).toBeDefined();
    });

    it('should have required validators on form controls', () => {
      const titleControl = component['tileEditorForm'].get('title');
      const descriptionControl = component['tileEditorForm'].get('description');

      titleControl?.setValue('');
      descriptionControl?.setValue('');

      expect(titleControl?.valid).toBeFalsy();
      expect(descriptionControl?.valid).toBeFalsy();
      expect(component['tileEditorForm'].valid).toBeFalsy();
    });

    it('should initialize with default image sources', () => {
      expect(component['imagePreview']).toBe(component['defaultImageSrc']);
      expect(component['newUpdatedImage']).toBe(component['defaultImageSrc']);
    });
  });

  describe('Form Validation', () => {
    it('should validate form as invalid when fields are empty', () => {
      component['tileEditorForm'].get('title')?.setValue('');
      component['tileEditorForm'].get('description')?.setValue('');

      expect(component['tileEditorForm'].valid).toBeFalsy();
    });

    it('should validate form as valid when all fields are filled', () => {
      component['tileEditorForm'].get('title')?.setValue('Test Title');
      component['tileEditorForm'].get('description')?.setValue('Test Description');

      expect(component['tileEditorForm'].valid).toBeTruthy();
    });
  });

  describe('File Handling', () => {
    it('should handle file selection and set preview', () => {
      const mockFile = new File(['test'], 'test.webp', { type: 'image/webp' });

      // Create a proper HTMLInputElement mock
      const mockInput = Object.create(HTMLInputElement.prototype);
      Object.defineProperty(mockInput, 'files', {
        value: [mockFile],
        writable: true,
      });

      const mockEvent = {
        target: mockInput,
      } as Event;

      // Mock FileReader
      const mockFileReader = {
        onload: jest.fn(),
        readAsDataURL: jest.fn(),
        result: 'data:image/webp;base64,test',
      };

      // Spy on FileReader constructor
      const fileReaderSpy = jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any);

      component['onFileSelected'](mockEvent);

      // Simulate the onload callback
      mockFileReader.onload({ target: { result: 'data:image/webp;base64,test' } } as any);

      expect(component['selectedFile']).toBe(mockFile);
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile);
      expect(component['imageUrl']).toBe('data:image/webp;base64,test');
      expect(component['imagePreview']).toBe('data:image/webp;base64,test');

      fileReaderSpy.mockRestore();
    });

    it('should handle invalid file selection gracefully', () => {
      const mockEvent = {
        target: { files: [] },
      } as any;

      expect(() => {
        component['onFileSelected'](mockEvent);
      }).not.toThrow();

      expect(component['selectedFile']).toBeNull();
    });
  });

  describe('Save Changes', () => {
    beforeEach(() => {
      component['tileEditorForm'].get('title')?.setValue('Test Title');
      component['tileEditorForm'].get('description')?.setValue('Test Description');
    });

    it('should not save changes when form is invalid', async () => {
      component['tileEditorForm'].get('title')?.setValue('');

      await component['saveChanges']();

      expect(mockSetDataService.setRecord).not.toHaveBeenCalled();
    });
  });

  describe('Delete Tile', () => {
    it('should handle icon file deletion failure gracefully', async () => {
      mockSetDataService.deleteRecord.mockReturnValue(of('successfull'));
      mockSetDataService.deleteFileFromStorage.mockReturnValue(of(undefined).pipe(
        map(() => { throw new Error('File not found'); }),
      ));

      const closeSpy = jest.spyOn(component['dialogRef'], 'close');

      await component['deleteTile']();

      // Should still succeed even if icon file deletion fails
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to card editor with correct data', () => {
      component['tileEditorForm'].get('title')?.setValue('Test Title');
      component['tileEditorForm'].get('description')?.setValue('Test Description');

      const dialogSpy = jest.spyOn(component['dialog'], 'open');
      const closeSpy = jest.spyOn(component['dialogRef'], 'close');

      component['goToCardEditor']();

      expect(closeSpy).toHaveBeenCalled();
      expect(dialogSpy).toHaveBeenCalledWith(
        AddPortfolioRecordComponent,
        expect.objectContaining({
          data: expect.objectContaining({
            currentId: 3,
            heading: 'Test Title',
            type: ProjectCardType.standard,
          }),
        }),
      );
    });
  });

  describe('Cleanup', () => {
    it('should clear intervals and timeouts on destroy', () => {
      component['uploadProgressIntervalId'] = 123;
      component['uploadTimeoutId'] = 456;
      component['imageUrlSubscription'] = { unsubscribe: jest.fn() } as any;

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      component.ngOnDestroy();

      expect(clearIntervalSpy).toHaveBeenCalledWith(123);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(456);
      expect(component['imageUrlSubscription'].unsubscribe).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    });
  });
});
