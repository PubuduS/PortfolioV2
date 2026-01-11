import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { provideMockStore } from '@ngrx/store/testing';
import { createSpyObj } from 'jest-createspyobj';
import { of } from 'rxjs';

import { IProjectCard } from '@portfolio-v2/state/dataModels';
import {
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { callComponentMethod } from '@portfolio-v2/shared/test-helpers';
import { ProjectCardType } from '@portfolio-v2/admin/shared/components';
import { DeletePortfolioTileComponent } from './delete-portfolio-tile.component';

describe('DeletePortfolioTileComponent', () => {
  let component: DeletePortfolioTileComponent;
  let fixture: ComponentFixture<DeletePortfolioTileComponent>;
  let utility: jest.Mocked<UtilityService>;
  let setDataService: jest.Mocked<SetDataService>;

  const mockProject: IProjectCard = {
    id: 1,
    heading: 'Test Project',
    description: 'Test project description',
    tools: 'Test tools',
    imageURL: 'https://example.com/image.jpg',
  };

  const mockProjectData = {
    recordId: mockProject.id,
    type: ProjectCardType.standard,
  };

  beforeEach(async () => {
    utility = createSpyObj(UtilityService);
    setDataService = createSpyObj(SetDataService);
    utility['getPaddedDigits'].mockReturnValue('01');
    setDataService['deleteRecord'].mockReturnValue(of('successfull'));
    setDataService['deleteFileFromStorage'].mockReturnValue(of('successfull'));

    await TestBed.configureTestingModule({
      imports: [
        DeletePortfolioTileComponent,
      ],
      providers: [
        provideMockStore({
          initialState: {
            projectCards: [mockProject],
            featuredProjectCards: [mockProject],
          },
        }),
        { provide: MAT_DIALOG_DATA, useValue: mockProjectData },
        { provide: MatDialogRef, useValue: createSpyObj(MatDialogRef.name, ['close']) },
        { provide: SetDataService, useValue: setDataService },
        { provide: UtilityService, useValue: utility },

      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeletePortfolioTileComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(component['projectCard']).toBeDefined();
    });

    it('should have access to injected data', () => {
      expect(component.data).toBe(mockProjectData);
      expect(component.data.recordId).toBe(mockProject.id);
      expect(component.data.type).toBe(ProjectCardType.standard);
    });
  });

  describe('Delete Tile Functionality', () => {
    it('should not delete if project ID is not available', () => {
      const invalidProjectData = {
        project: { ...mockProject, id: undefined as any },
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [DeletePortfolioTileComponent],
        providers: [
          provideMockStore({}),
          { provide: MAT_DIALOG_DATA, useValue: invalidProjectData },
          { provide: MatDialogRef, useValue: createSpyObj(MatDialogRef.name, ['close']) },
          { provide: SetDataService, useValue: setDataService },
          { provide: UtilityService, useValue: utility },
        ],
      });

      const newComponent = TestBed.createComponent(DeletePortfolioTileComponent);
      const { componentInstance } = newComponent;

      callComponentMethod(componentInstance, 'deleteTile');

      expect(setDataService['deleteRecord']).not.toHaveBeenCalled();
    });

    it('should delete tile, card data, and storage files when project ID is available', () => {
      callComponentMethod(component, 'deleteTile');

      expect(setDataService['deleteFileFromStorage']).toHaveBeenCalledTimes(2);
      expect(setDataService['deleteFileFromStorage']).toHaveBeenCalledWith(
        'portfolio/portfolio-tiles/ID-01-Icon.webp',
      );
      expect(setDataService['deleteFileFromStorage']).toHaveBeenCalledWith(
        'portfolio/project-screenshots/normal/ID-01-Screenshot.webp',
      );

      expect(setDataService['deleteRecord']).toHaveBeenCalledTimes(2);
      expect(setDataService['deleteRecord']).toHaveBeenCalledWith(
        'project-icon-section/project-01/',
      );
      expect(setDataService['deleteRecord']).toHaveBeenCalledWith(
        'project-data-section/project-01/',
      );
    });

    it('should call utility service to format project ID', () => {
      callComponentMethod(component, 'deleteTile');

      expect(utility['getPaddedDigits']).toHaveBeenCalledWith(mockProject.id, 2);
    });

    it('should attempt all delete operations when project ID is available', () => {
      callComponentMethod(component, 'deleteTile');

      expect(setDataService['deleteFileFromStorage']).toHaveBeenCalledWith(
        'portfolio/portfolio-tiles/ID-01-Icon.webp',
      );
      expect(setDataService['deleteFileFromStorage']).toHaveBeenCalledWith(
        'portfolio/project-screenshots/normal/ID-01-Screenshot.webp',
      );

      expect(setDataService['deleteRecord']).toHaveBeenCalledWith(
        'project-icon-section/project-01/',
      );

      expect(setDataService['deleteRecord']).toHaveBeenCalledWith(
        'project-data-section/project-01/',
      );
    });

    it('should call utility service to format project ID', () => {
      callComponentMethod(component, 'deleteTile');

      expect(utility['getPaddedDigits']).toHaveBeenCalledWith(mockProject.id, 2);
    });

    // Note: Store dispatch behavior is tested in integration tests
    // since forkJoin async behavior is complex to test with mocked services
    // The unit tests focus on verifying correct service method calls
  });

  describe('Featured Project Deletion', () => {
    let featuredComponent: DeletePortfolioTileComponent;
    let featuredFixture: ComponentFixture<DeletePortfolioTileComponent>;

    const mockFeaturedProjectData = {
      recordId: mockProject.id,
      type: ProjectCardType.featured,
    };

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [DeletePortfolioTileComponent],
        providers: [
          provideMockStore({
            initialState: {
              featuredProjectCards: [mockProject],
            },
          }),
          { provide: MAT_DIALOG_DATA, useValue: mockFeaturedProjectData },
          { provide: MatDialogRef, useValue: createSpyObj(MatDialogRef.name, ['close']) },
          { provide: SetDataService, useValue: setDataService },
          { provide: UtilityService, useValue: utility },
        ],
      }).compileComponents();

      featuredFixture = TestBed.createComponent(DeletePortfolioTileComponent);
      featuredComponent = featuredFixture.componentInstance;
      await featuredFixture.whenStable();
    });

    it('should initialize with correct data for featured projects', () => {
      expect(featuredComponent.data).toBe(mockFeaturedProjectData);
      expect(featuredComponent.data.recordId).toBe(mockProject.id);
      expect(featuredComponent.data.type).toBe(ProjectCardType.featured);
    });

    it('should delete featured project files and database record', () => {
      callComponentMethod(featuredComponent, 'deleteFeaturedProject');

      expect(setDataService['deleteFileFromStorage']).toHaveBeenCalledTimes(2);
      expect(setDataService['deleteFileFromStorage']).toHaveBeenCalledWith(
        'portfolio/project-screenshots/featured/ID-01-Screenshot.webp',
      );
      expect(setDataService['deleteFileFromStorage']).toHaveBeenCalledWith(
        'portfolio/featured-projects/ID-01-Image.webp',
      );

      expect(setDataService['deleteRecord']).toHaveBeenCalledTimes(1);
      expect(setDataService['deleteRecord']).toHaveBeenCalledWith(
        'featured-project-section/project-01/',
      );
    });

    it('should call utility service to format featured project ID', () => {
      callComponentMethod(featuredComponent, 'deleteFeaturedProject');

      expect(utility['getPaddedDigits']).toHaveBeenCalledWith(mockProject.id, 2);
    });
  });

  describe('Dialog Integration', () => {
    it('should have access to dialog reference', () => {
      expect(component.dialogRef).toBeDefined();
    });

    it('should have access to dialog data', () => {
      expect(component.data).toBe(mockProjectData);
    });
  });
});
