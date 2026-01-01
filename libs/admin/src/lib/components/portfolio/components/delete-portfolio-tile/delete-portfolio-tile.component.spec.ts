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
import {
  of,
  take,
} from 'rxjs';

import { StateActions } from '@portfolio-v2/state';
import { IProjectCard } from '@portfolio-v2/state/dataModels';
import {
  SetDataService,
  UtilityService,
} from '@portfolio-v2/shared/services';
import { callComponentMethod } from '@portfolio-v2/shared/test-helpers';
import { DeletePortfolioTileComponent } from './delete-portfolio-tile.component';

describe('DeletePortfolioTileComponent', () => {
  let component: DeletePortfolioTileComponent;
  let fixture: ComponentFixture<DeletePortfolioTileComponent>;
  let store: MockStore;
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
    project: mockProject,
  };

  beforeEach(async () => {
    utility = createSpyObj(UtilityService);
    setDataService = createSpyObj(SetDataService);
    utility['getPaddedDigits'].mockReturnValue('01');
    setDataService['deleteRecord'].mockReturnValue(of('successfull'));

    await TestBed.configureTestingModule({
      imports: [
        DeletePortfolioTileComponent,
      ],
      providers: [
        provideMockStore({
          initialState: {
            projectCards: [mockProject],
          },
        }),
        { provide: MAT_DIALOG_DATA, useValue: mockProjectData },
        { provide: MatDialogRef, useValue: createSpyObj(MatDialogRef.name, ['close']) },
        { provide: SetDataService, useValue: setDataService },
        { provide: UtilityService, useValue: utility },

      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);

    fixture = TestBed.createComponent(DeletePortfolioTileComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(component['isTileDeleteSuccess']).toBeDefined();
      expect(component['isCardDeleteSuccess']).toBeDefined();
    });

    it('should have access to injected data', () => {
      expect(component.data).toBe(mockProjectData);
      expect(component.data.project).toBe(mockProject);
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

    it('should delete tile and card data when project ID is available', () => {
      callComponentMethod(component, 'deleteTile');

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

    it('should dispatch store action when tile deletion is successful', (done) => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      callComponentMethod(component, 'deleteTile');

      // Subscribe to the observable to trigger the dispatch
      component['isTileDeleteSuccess']
        .pipe(
          take(1),
        )
        .subscribe(() => {
          expect(dispatchSpy).toHaveBeenCalledWith(
            StateActions.portfolioCardsStateConnect(),
          );
          done();
        });
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
