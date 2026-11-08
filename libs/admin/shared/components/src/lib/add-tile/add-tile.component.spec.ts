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
import {
  of,
  Subscription,
  throwError,
} from 'rxjs';
import { map } from 'rxjs/operators';

import { StateActions } from '@portfolio-v2/state';
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
      expect(component['tileEditorForm'].title()).toBeDefined();
      expect(component['tileEditorForm'].description()).toBeDefined();
    });

    it('should have required validators on form controls', () => {
      const titleControl = component['tileEditorForm'].title();
      const descriptionControl = component['tileEditorForm'].description();

      titleControl.value.set('');
      descriptionControl.value.set('');

      expect(titleControl.valid()).toBeFalsy();
      expect(descriptionControl.valid()).toBeFalsy();
      expect(component['tileEditorForm']().valid()).toBeFalsy();
    });

    it('should initialize with default image sources', () => {
      expect(component['imagePreview']()).toBe(component['defaultImageSrc']);
      expect(component['newUpdatedImage']()).toBe(component['defaultImageSrc']);
    });
  });

  describe('Form Validation', () => {
    it('should validate form as invalid when fields are empty', () => {
      component['tileEditorForm'].title().value.set('');
      component['tileEditorForm'].description().value.set('');

      expect(component['tileEditorForm']().valid()).toBeFalsy();
    });

    it('should validate form as valid when all fields are filled', () => {
      component['tileEditorForm'].title().value.set('Test Title');
      component['tileEditorForm'].description().value.set('Test Description');

      expect(component['tileEditorForm']().valid()).toBeTruthy();
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
      } as unknown as Event;

      // Mock FileReader
      const mockFileReader = {
        onload: jest.fn(),
        readAsDataURL: jest.fn(),
        result: 'data:image/webp;base64,test',
      };

      // Spy on FileReader constructor
      const fileReaderSpy = jest.spyOn(global, 'FileReader').mockImplementation(
        () => mockFileReader as unknown as FileReader,
      );

      component['onFileSelected'](mockEvent);

      // Simulate the onload callback
      mockFileReader.onload?.(new ProgressEvent('load'));

      expect(component['selectedFile']).toBe(mockFile);
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile);
      expect(component['imageUrl']()).toBe('data:image/webp;base64,test');
      expect(component['imagePreview']()).toBe('data:image/webp;base64,test');

      fileReaderSpy.mockRestore();
    });

    it('should handle invalid file selection gracefully', () => {
      const mockEvent = {
        target: { files: [] },
      } as unknown as Event;

      expect(() => {
        component['onFileSelected'](mockEvent);
      }).not.toThrow();

      expect(component['selectedFile']).toBeNull();
    });
  });

  describe('Save Changes', () => {
    beforeEach(() => {
      component['tileEditorForm'].title().value.set('Test Title');
      component['tileEditorForm'].description().value.set('Test Description');
    });

    it('should not save changes when form is invalid', async () => {
      component['tileEditorForm'].title().value.set('');

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
      component['tileEditorForm'].title().value.set('Test Title');
      component['tileEditorForm'].description().value.set('Test Description');

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
      component['imageUrlSubscription'] = { unsubscribe: jest.fn() } as unknown as Subscription;

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      component.ngOnDestroy();

      expect(clearIntervalSpy).toHaveBeenCalledWith(123);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(456);
      expect(component['imageUrlSubscription'].unsubscribe).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    });

    it('should destroy cleanly when nothing is in flight', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('when the tile is stored', () => {
    beforeEach(() => {
      mockUtilityService.getPaddedDigits.mockReturnValue('03');
      mockSetDataService.pushFileToStorage.mockResolvedValue(undefined);
      mockSetDataService.getProgressValue.mockReturnValue(80);
      mockSetDataService.getUploadCompleteState.mockReturnValue(true);
      mockGetDataService.getPhotoURL.mockReturnValue(of('https://cdn.example/icon.webp'));
      mockSetDataService.setRecord.mockReturnValue(of('successfull'));
      component['tileEditorForm'].title().value.set('Test Title');
      component['tileEditorForm'].description().value.set('Test Description');
      jest.spyOn(store, 'dispatch');
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should save the placeholder when no file was picked', async () => {
      await component['saveChanges']();
      let saved = false;
      component['isEditSuccess'].subscribe((value) => {
        saved = value;
      });

      expect(saved).toBe(true);
      expect(mockSetDataService.setRecord).toHaveBeenCalledWith(
        'project-icon-section/project-03/',
        expect.objectContaining({
          id: 3,
          viewHeading: 'Test Title',
          imageURL: component['defaultImageSrc'],
        }),
      );
      expect(component['imagePreview']()).toBe(component['defaultImageSrc']);
      expect(component['newUpdatedImage']()).toBe(component['defaultImageSrc']);
      expect(store.dispatch).toHaveBeenCalledWith(StateActions.portfolioCardsStateConnect());
    });

    it('should save the download url after the file uploads', async () => {
      jest.useFakeTimers();
      component['selectedFile'] = new File(['icon'], 'icon.webp', { type: 'image/webp' });
      component['imageUrl'].set('data:image/webp;base64,abc');
      const pending = component['saveChanges']();
      await jest.advanceTimersByTimeAsync(100);
      await pending;

      expect(mockSetDataService.pushFileToStorage).toHaveBeenCalledWith(
        'portfolio/portfolio-tiles/ID-03-Icon.webp',
        'data:image/webp;base64,abc',
      );
      expect(component['progressValue']()).toBe(80);
      expect(mockSetDataService.setRecord).toHaveBeenCalledWith(
        'project-icon-section/project-03/',
        expect.objectContaining({ imageURL: 'https://cdn.example/icon.webp' }),
      );
      expect(component['newUpdatedImage']()).toBe('https://cdn.example/icon.webp');
    });

    it('should keep the placeholder when the upload does not return a url', async () => {
      jest.useFakeTimers();
      mockGetDataService.getPhotoURL.mockReturnValue(of(''));
      component['selectedFile'] = new File(['icon'], 'icon.webp', { type: 'image/webp' });
      const pending = component['saveChanges']();
      const saved = pending.then(() => mockSetDataService.setRecord.mock.calls[0]?.[1]);
      await jest.advanceTimersByTimeAsync(100);
      await expect(saved).resolves.toEqual(expect.objectContaining({
        imageURL: component['defaultImageSrc'],
      }));
    });

    it('should mark the save failed when the record errors', async () => {
      mockSetDataService.setRecord.mockReturnValue(throwError(() => new Error('offline')));
      const next = jest.spyOn(component['editSuccessSubject'], 'next');

      await component['saveChanges']();

      expect(next).toHaveBeenCalledWith(false);
    });

    it('should mark the save failed when the record is not stored', async () => {
      mockSetDataService.setRecord.mockReturnValue(of('failed'));
      component['imagePreview'].set('data:image/webp;base64,abc');

      await component['saveChanges']();
      let saved = true;
      component['isEditSuccess'].subscribe((value) => {
        saved = value;
      });

      expect(saved).toBe(false);
      expect(component['imagePreview']()).toBe('data:image/webp;base64,abc');
    });

    it('should stop when the tile list has not loaded', async () => {
      store.overrideSelector(portfolioCardsSelector, undefined);
      store.refreshState();

      await component['saveChanges']();

      expect(mockSetDataService.setRecord).not.toHaveBeenCalled();
    });

    it('should give up when storage does not finish', async () => {
      jest.useFakeTimers();
      mockSetDataService.getUploadCompleteState.mockReturnValue(false);
      mockSetDataService.pushFileToStorage.mockRejectedValue(new Error('offline'));
      component['uploadProgressIntervalId'] = 19;
      const pending = component['uploadFileAndGetUrl']('portfolio/portfolio-tiles/ID-03-Icon.webp');
      const failed = expect(pending).rejects.toThrow('Upload timeout');

      await jest.advanceTimersByTimeAsync(30000);

      await failed;
    });

    it('should reject when the download lookup fails', async () => {
      jest.useFakeTimers();
      mockGetDataService.getPhotoURL.mockReturnValue(throwError(() => new Error('storage down')));
      const pending = component['uploadFileAndGetUrl']('portfolio/portfolio-tiles/ID-03-Icon.webp');
      const failed = expect(pending).rejects.toThrow('storage down');

      await jest.advanceTimersByTimeAsync(100);

      await failed;
    });
  });

  describe('when the tile is deleted', () => {
    beforeEach(() => {
      mockUtilityService.getPaddedDigits.mockReturnValue('03');
    });

    it('should close after the record and the icon are removed', async () => {
      mockSetDataService.deleteRecord.mockReturnValue(of('successfull'));
      mockSetDataService.deleteFileFromStorage.mockReturnValue(of('removed'));
      jest.spyOn(store, 'dispatch');

      await component['deleteTile']();

      expect(component['dialogRef'].close).toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledWith(StateActions.portfolioCardsStateConnect());
    });

    it('should stay open when the record is not removed', async () => {
      mockSetDataService.deleteRecord.mockReturnValue(of('failed'));
      mockSetDataService.deleteFileFromStorage.mockReturnValue(of('removed'));

      await component['deleteTile']();

      expect(component['dialogRef'].close).not.toHaveBeenCalled();
    });

    it('should stay open when the record delete errors', async () => {
      mockSetDataService.deleteRecord.mockReturnValue(throwError(() => new Error('offline')));

      await component['deleteTile']();

      expect(component['dialogRef'].close).not.toHaveBeenCalled();
    });
  });
});
