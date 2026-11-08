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
import { of } from 'rxjs';

import { StateActions } from '@portfolio-v2/state';
import { IProjectView } from '@portfolio-v2/state/dataModels';
import { portfolioCardsSelector } from '@portfolio-v2/state/selectors';
import {
  GetDataService,
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { callComponentMethod } from '@portfolio-v2/shared/test-helpers';
import { DescriptionCardComponent } from './description-card.component';

describe('DescriptionCardComponent', () => {
  let component: DescriptionCardComponent;
  let fixture: ComponentFixture<DescriptionCardComponent>;
  let store: MockStore;

  const mockProject: IProjectView = {
    id: 2,
    imageURL: 'https://example.com/image.jpg',
    viewHeading: 'Test Project',
    viewDescription: 'Test project description',
  };

  const mockProjectData = {
    project: mockProject,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescriptionCardComponent],
      providers: [
        provideMockStore(),
        { provide: MAT_DIALOG_DATA, useValue: mockProjectData },
        {
          provide: MatDialogRef,
          useValue: createSpyObj(MatDialogRef.name, ['close']),
        },
        {
          provide: GetDataService,
          useValue: createSpyObj(GetDataService.name, ['getPhotoURL']),
        },
        {
          provide: SetDataService,
          useValue: createSpyObj(SetDataService.name, [
            'uploadDataUrl',
            'setRecord',
            'modifyAField',
          ]),
        },
        {
          provide: UtilityService,
          useValue: createSpyObj(UtilityService.name, ['getPaddedDigits']),
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);

    // Setup store selector
    store.overrideSelector(portfolioCardsSelector, [mockProject]);
    store.refreshState();

    fixture = TestBed.createComponent(DescriptionCardComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('Component Initialization', () => {
    it('should initialize form on ngOnInit', () => {
      callComponentMethod(component, 'ngOnInit');

      const form = component['tileEditorForm'];
      expect(form).toBeDefined();
      expect(form.title().value()).toBe(mockProject.viewHeading);
      expect(form.description().value()).toBe(mockProject.viewDescription);
    });

    it('should initialize with correct default values', () => {
      expect(component['defaultImageSrc']).toBe('https://placehold.co/120x120.png');
      expect(component['imagePreview']()).toBe('https://placehold.co/120x120.png');
      expect(component['imageUrl']()).toBe('');
      expect(component['isUploadCompleted']()).toBe(false);
      expect(component['progressValue']()).toBe(0);
    });

    it('should create form with required validators', () => {
      callComponentMethod(component, 'ngOnInit');

      const form = component['tileEditorForm'];
      form.title().value.set('');
      form.description().value.set('');
      expect(form.title().valid()).toBe(false);
      expect(form.description().valid()).toBe(false);
    });
  });

  describe('File Selection', () => {
    it('should not process if no file is selected', () => {
      const mockEvent = {
        target: {
          files: null,
        },
      } as unknown as Event;

      callComponentMethod(component, 'onFileSelected', mockEvent);

      expect(component['imageUrl']()).toBe('');
    });
  });

  describe('Template Integration', () => {
    beforeEach(() => {
      callComponentMethod(component, 'ngOnInit');
      fixture.detectChanges();
    });

    it('should render dialog title', () => {
      const compiled = fixture.nativeElement;
      const title = compiled.querySelector('h1[mat-dialog-title]');

      expect(title?.textContent?.trim()).toBe('Tile Editor');
    });

    it('should render form fields with correct initial values', () => {
      const compiled = fixture.nativeElement;
      const titleInput = compiled.querySelector('#title') as HTMLInputElement;
      const descriptionTextarea = compiled.querySelector('#description') as HTMLTextAreaElement;

      expect(titleInput?.value).toBe(mockProject.viewHeading);
      expect(descriptionTextarea?.value).toBe(mockProject.viewDescription);
    });

    it('should render current and new image previews', () => {
      const compiled = fixture.nativeElement;
      const images = compiled.querySelectorAll('img');

      expect(images.length).toBe(2); // Current and new image
      expect(images[0]?.src).toContain('placehold.co'); // New image preview
      expect(images[1]?.src).toBe(mockProject.imageURL); // Current image
    });

    it('should render progress bar', () => {
      const compiled = fixture.nativeElement;
      const progressBar = compiled.querySelector('mat-progress-bar');

      expect(progressBar).toBeTruthy();
    });

    it('should render action buttons', () => {
      const compiled = fixture.nativeElement;
      const buttons = compiled.querySelectorAll('button[mat-fab]');

      expect(buttons.length).toBe(2); // Save and Cancel buttons
      expect(buttons[0]?.textContent).toContain('Save');
      expect(buttons[1]?.textContent).toContain('Cancel');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      callComponentMethod(component, 'ngOnInit');
    });

    it('should mark title field as required', () => {
      const form = component['tileEditorForm'];
      const titleControl = form.title();

      titleControl.value.set('');
      expect(titleControl.valid()).toBeFalsy();

      titleControl.value.set('Valid Title');
      expect(titleControl.valid()).toBeTruthy();
    });

    it('should mark description field as required', () => {
      const form = component['tileEditorForm'];
      const descriptionControl = form.description();

      descriptionControl.value.set('');
      expect(descriptionControl.valid()).toBeFalsy();

      descriptionControl.value.set('Valid description');
      expect(descriptionControl.valid()).toBeTruthy();
    });
  });

  describe('Store Integration', () => {
    it('should select portfolio cards from store', () => {
      // The projectView signal should be initialized with the mock data
      expect(component['projectView']()).toEqual([mockProject]);
    });

    it('should update when store data changes', () => {
      const newData: IProjectView[] = [
        { ...mockProject, viewHeading: 'Updated Title' },
      ];

      store.overrideSelector(portfolioCardsSelector, newData);
      store.refreshState();

      expect(component['projectView']()).toEqual(newData);
    });
  });

  describe('when the tile is saved', () => {
    let setData: jest.Mocked<SetDataService>;
    let utility: jest.Mocked<UtilityService>;

    beforeEach(() => {
      setData = TestBed.inject(SetDataService) as jest.Mocked<SetDataService>;
      utility = TestBed.inject(UtilityService) as jest.Mocked<UtilityService>;
      utility.getPaddedDigits.mockReturnValue('02');
      setData.setRecord.mockReturnValue(of('successfull'));
      setData.modifyAField.mockReturnValue(of('successfull'));
      setData.uploadDataUrl.mockImplementation(async (_path, _dataUrl, onProgress) => {
        onProgress?.(100);
        return 'https://cdn.example/icon.webp';
      });
      jest.spyOn(store, 'dispatch');
      component.ngOnInit();
    });

    afterEach(() => {
      mockProjectData.project = mockProject;
      mockProject.id = 2;
      mockProject.viewHeading = 'Test Project';
      mockProject.viewDescription = 'Test project description';
      jest.useRealTimers();
    });

    it('should ignore a file picker that is not an input', () => {
      const input = document.createElement('input');

      component['onFileSelected']({ target: input } as unknown as Event);

      expect(component['imageUrl']()).toBe('');
    });

    it('should preview the file the editor picked', () => {
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

    it('should not write while the title is empty', () => {
      component['tileEditorForm'].title().value.set('');

      component['saveChanges']();

      expect(setData.setRecord).not.toHaveBeenCalled();
    });

    it('should keep the current image when no new file was picked', () => {
      component['saveChanges']();
      let saved = false;
      component['isEditSuccess'].subscribe((value) => {
        saved = value;
      });

      expect(saved).toBe(true);
      expect(setData.setRecord).toHaveBeenCalledWith(
        'project-icon-section/project-02/',
        expect.objectContaining({
          viewHeading: 'Test Project',
          imageURL: mockProject.imageURL,
        }),
      );
      expect(setData.modifyAField).toHaveBeenCalledWith(
        'project-data-section/project-02/',
        'Test Project',
        'heading',
      );
      expect(component['imagePreview']()).toBe(component['defaultImageSrc']);
    });

    it('should upload a new icon and store the preview until the download url arrives', async () => {
      component['imageUrl'].set('data:image/webp;base64,abc');

      component['saveChanges']();
      await Promise.resolve();

      expect(setData.uploadDataUrl).toHaveBeenCalledWith(
        'portfolio/portfolio-tiles/ID-02-Icon.webp',
        'data:image/webp;base64,abc',
        expect.any(Function),
      );
      expect(component['progressValue']()).toBe(100);
      expect(component['isUploadCompleted']()).toBe(true);
      expect(setData.setRecord).toHaveBeenCalledWith(
        'project-icon-section/project-02/',
        expect.objectContaining({ imageURL: 'data:image/webp;base64,abc' }),
      );
      expect(component['imageUrl']()).toBe('https://cdn.example/icon.webp');
    });

    it('should leave the preview when the record does not save', () => {
      setData.setRecord.mockReturnValue(of('failed'));
      setData.modifyAField.mockReturnValue(of('failed'));
      component['imagePreview'].set('data:image/webp;base64,abc');

      component['saveChanges']();
      let saved = true;
      component['isEditSuccess'].subscribe((value) => {
        saved = value;
      });

      expect(saved).toBe(false);
      expect(component['imagePreview']()).toBe('data:image/webp;base64,abc');
      expect(store.dispatch).toHaveBeenCalledWith(StateActions.portfolioCardsStateConnect());
    });

    it('should stop when the tile list has not loaded', () => {
      store.overrideSelector(portfolioCardsSelector, undefined);
      store.refreshState();

      component['saveChanges']();

      expect(setData.setRecord).not.toHaveBeenCalled();
    });

    it('should leave the project card when the heading update fails', () => {
      setData.modifyAField.mockReturnValue(of('failed'));

      component['saveChanges']();
      component['isEditSuccess'].subscribe();

      expect(setData.modifyAField).toHaveBeenCalled();
    });

    it('should not change the featured card heading', () => {
      component.data.project = { ...component.data.project, id: 1 };

      component['saveChanges']();
      component['isEditSuccess'].subscribe();

      expect(setData.modifyAField).not.toHaveBeenCalled();
    });

    it('should keep the preview when storage rejects the upload', async () => {
      setData.uploadDataUrl.mockRejectedValue(new Error('offline'));
      component['imageUrl'].set('data:image/webp;base64,abc');

      component['saveChanges']();
      await Promise.resolve();

      expect(component['imageUrl']()).toBe('data:image/webp;base64,abc');
    });

    it('should use placeholder copy when the tile has no text', () => {
      component.data.project = {
        ...component.data.project,
        viewHeading: undefined as unknown as string,
        viewDescription: undefined as unknown as string,
      };

      component.ngOnInit();

      expect(component['tileEditorForm'].title().value()).toBe('title');
      expect(component['tileEditorForm'].description().value()).toBe('description');
    });
  });
});
