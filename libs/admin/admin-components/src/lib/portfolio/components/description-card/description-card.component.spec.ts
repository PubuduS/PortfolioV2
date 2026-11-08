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
import { Subscription } from 'rxjs';

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
            'pushFileToStorage',
            'getProgressValue',
            'getUploadCompleteState',
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

  describe('Component Cleanup', () => {
    it('should unsubscribe from subscriptions on destroy', () => {
      const unsubscribeSpy = jest.fn();
      component['imageUrlSubscription'] = { unsubscribe: unsubscribeSpy } as Subscription;

      callComponentMethod(component, 'ngOnDestroy');
      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should clear upload progress interval on destroy', () => {
      const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
      component['uploadProgressIntervalId'] = 456;

      callComponentMethod(component, 'ngOnDestroy');

      expect(clearIntervalSpy).toHaveBeenCalledWith(456);
    });

    it('should handle missing subscriptions gracefully', () => {
      expect(() => {
        callComponentMethod(component, 'ngOnDestroy');
      }).not.toThrow();
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
});
