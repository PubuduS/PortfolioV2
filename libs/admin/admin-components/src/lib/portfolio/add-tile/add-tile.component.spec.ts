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
import { ProjectCardType } from '@portfolio-v2/admin/shared/components';
import { PortfolioWriter } from '../services/portfolio-writer.service';
import { AddTileComponent } from './add-tile.component';

describe('AddTileComponent', () => {
  let component: AddTileComponent;
  let fixture: ComponentFixture<AddTileComponent>;
  let store: MockStore;
  let mockSetDataService: jest.Mocked<SetDataService>;
  let writer: jest.Mocked<PortfolioWriter>;
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
    writer = createSpyObj(PortfolioWriter);
    writer.saveTile.mockResolvedValue(undefined);
    writer.removeNewTile.mockResolvedValue(undefined);
    mockGetDataService = createSpyObj(GetDataService);
    mockUtilityService = createSpyObj(UtilityService);

    await TestBed.configureTestingModule({
      imports: [
        AddTileComponent,
      ],
      providers: [
        provideMockStore({}),
        { provide: SetDataService, useValue: mockSetDataService },
        { provide: PortfolioWriter, useValue: writer },
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

      expect(writer.saveTile).not.toHaveBeenCalled();
    });
  });

  describe('Delete Tile', () => {
    it('should close after the new tile is removed', async () => {
      const closeSpy = jest.spyOn(component['dialogRef'], 'close');

      await component['deleteTile']();

      expect(writer.removeNewTile).toHaveBeenCalledWith(component['currentCardId']);
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should hand the saved tile back so the page can open the card editor', () => {
      component['tileEditorForm'].title().value.set('Test Title');
      component['tileEditorForm'].description().value.set('Test Description');

      const closeSpy = jest.spyOn(component['dialogRef'], 'close');

      component['goToCardEditor']();

      expect(closeSpy).toHaveBeenCalledWith({
        currentId: 3,
        heading: 'Test Title',
        type: ProjectCardType.standard,
      });
    });
  });

  describe('Cleanup', () => {
    it('should clear a pending upload timeout on destroy', () => {
      component['uploadTimeoutId'] = 456;
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      component.ngOnDestroy();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(456);
      clearTimeoutSpy.mockRestore();
    });

    it('should destroy cleanly when nothing is in flight', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('when the tile is stored', () => {
    beforeEach(() => {
      mockUtilityService.getPaddedDigits.mockReturnValue('03');
      mockSetDataService.uploadDataUrl.mockImplementation(async (_path, _dataUrl, onProgress) => {
        onProgress?.(80);
        return 'https://cdn.example/icon.webp';
      });
      writer.saveTile.mockResolvedValue(undefined);
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
      expect(writer.saveTile).toHaveBeenCalledWith(expect.objectContaining({
        id: 3,
        viewHeading: 'Test Title',
        imageURL: component['defaultImageSrc'],
      }));
      expect(component['imagePreview']()).toBe(component['defaultImageSrc']);
      expect(component['newUpdatedImage']()).toBe(component['defaultImageSrc']);
      expect(store.dispatch).toHaveBeenCalledWith(StateActions.portfolioCardsStateConnect());
    });

    it('should save the download url after the file uploads', async () => {
      component['selectedFile'] = new File(['icon'], 'icon.webp', { type: 'image/webp' });
      component['imageUrl'].set('data:image/webp;base64,abc');

      await component['saveChanges']();

      expect(mockSetDataService.uploadDataUrl).toHaveBeenCalledWith(
        'portfolio/portfolio-tiles/ID-03-Icon.webp',
        'data:image/webp;base64,abc',
        expect.any(Function),
      );
      expect(component['progressValue']()).toBe(80);
      expect(writer.saveTile).toHaveBeenCalledWith(
        expect.objectContaining({ imageURL: 'https://cdn.example/icon.webp' }),
      );
      expect(component['newUpdatedImage']()).toBe('https://cdn.example/icon.webp');
    });

    it('should keep the placeholder when the upload fails', async () => {
      mockSetDataService.uploadDataUrl.mockRejectedValue(new Error('offline'));
      component['selectedFile'] = new File(['icon'], 'icon.webp', { type: 'image/webp' });

      await component['saveChanges']();

      expect(writer.saveTile).toHaveBeenCalledWith(
        expect.objectContaining({ imageURL: component['defaultImageSrc'] }),
      );
    });

    it('should mark the save failed when the record is not stored', async () => {
      writer.saveTile.mockRejectedValue(new Error('offline'));
      component['imagePreview'].set('data:image/webp;base64,abc');

      await component['saveChanges']();
      await Promise.resolve();
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

      expect(writer.saveTile).not.toHaveBeenCalled();
    });

    it('should give up when storage does not finish', async () => {
      jest.useFakeTimers();
      mockSetDataService.uploadDataUrl.mockImplementation(() => new Promise(() => {
        // The upload never finishes, so the dialog timeout wins.
      }));
      const pending = component['uploadFileAndGetUrl']('portfolio/portfolio-tiles/ID-03-Icon.webp');
      const failed = expect(pending).rejects.toThrow('Upload timeout');

      await jest.advanceTimersByTimeAsync(30000);

      await failed;
    });

    it('should reject when the upload fails', async () => {
      mockSetDataService.uploadDataUrl.mockRejectedValue(new Error('storage down'));

      await expect(
        component['uploadFileAndGetUrl']('portfolio/portfolio-tiles/ID-03-Icon.webp'),
      ).rejects.toThrow('storage down');
    });
  });

  describe('when the tile is deleted', () => {
    beforeEach(() => {
      mockUtilityService.getPaddedDigits.mockReturnValue('03');
    });

    it('should close after the record and the icon are removed', async () => {
      jest.spyOn(store, 'dispatch');

      await component['deleteTile']();

      expect(writer.removeNewTile).toHaveBeenCalledWith(component['currentCardId']);
      expect(component['dialogRef'].close).toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledWith(StateActions.portfolioCardsStateConnect());
    });

    it('should stay open when the record is not removed', async () => {
      writer.removeNewTile.mockRejectedValue(new Error('offline'));

      await component['deleteTile']();

      expect(component['dialogRef'].close).not.toHaveBeenCalled();
    });
  });
});
