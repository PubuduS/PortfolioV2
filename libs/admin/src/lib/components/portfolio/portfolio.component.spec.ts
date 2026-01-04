import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createSpyObj } from 'jest-createspyobj';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';

import { portfolioCardsSelector } from '@portfolio-v2/state/selectors';
import { IProjectView } from '@portfolio-v2/state/dataModels';
import { StateActions } from '@portfolio-v2/state';
import {
  getComponentProperty,
  callComponentMethod,
} from '@portfolio-v2/shared/test-helpers';
import { PortfolioComponent } from './portfolio.component';
import { ProjectCardsComponent } from './components/project-cards/project-cards.component';
import { DescriptionCardComponent } from './components/description-card/description-card.component';
import { DeletePortfolioTileComponent } from './components/delete-portfolio-tile/delete-portfolio-tile.component';

describe('PortfolioComponent', () => {
  let component: PortfolioComponent;
  let fixture: ComponentFixture<PortfolioComponent>;
  let store: MockStore;

  const mockData: IProjectView[] = [
    {
      id: 1,
      imageURL: 'featured-project.jpg',
      viewHeading: 'Featured Project',
      viewDescription: 'This is a featured project',
    },
    {
      id: 2,
      imageURL: 'regular-project.jpg',
      viewHeading: 'Regular Project',
      viewDescription: 'This is a regular project',
    },
  ];

  beforeEach(async () => {
    const dialogSpy = createSpyObj(MatDialog.name, ['open']);
    const routerSpy = createSpyObj(Router.name, ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        PortfolioComponent,
        MockComponents(
          ProjectCardsComponent,
          DescriptionCardComponent,
          DeletePortfolioTileComponent,
        ),
      ],
      providers: [
        provideMockStore(),
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);

    store.overrideSelector(portfolioCardsSelector, mockData);
    store.refreshState();

    fixture = TestBed.createComponent(PortfolioComponent);
    component = fixture.componentInstance;

    // Setup spies for component services manually
    jest.spyOn(component['dialog'], 'open');
    jest.spyOn(component['router'], 'navigate');

    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('Component Properties', () => {
    it('should have correct tooltip text', () => {
      expect(getComponentProperty(component, 'toolTip')).toBe('Click here to see more');
    });

    it('should initialize projectView signal with store selector', () => {
      const projectView = getComponentProperty(component, 'projectView') as () => IProjectView[];
      expect(projectView).toBeDefined();
      expect(projectView()).toEqual(mockData);
    });
  });

  describe('openDialog', () => {
    it('should dispatch projectCardIDStateUpdated action', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      const projectId = 2;

      (component as any).openDialog(projectId);

      expect(dispatchSpy).toHaveBeenCalledWith(
        StateActions.projectCardIDStateUpdated({ selectedProjectCardID: projectId }),
      );
    });

    it('should open ProjectCardsComponent dialog with correct config', () => {
      const projectId = 2;
      const expectedConfig = {
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        width: '800px',
      };

      callComponentMethod(component, 'openDialog', projectId);

      expect(component['dialog'].open).toHaveBeenCalledWith(ProjectCardsComponent, expectedConfig);
    });
  });

  describe('openDialogDescription', () => {
    it('should open DescriptionCardComponent dialog with correct config and data', () => {
      const project = mockData[0];
      const expectedConfig = {
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        width: '600px',
        data: { project },
      };

      callComponentMethod(component, 'openDialogDescription', project);

      expect(component['dialog'].open).toHaveBeenCalledWith(DescriptionCardComponent, expectedConfig);
    });

    it('should pass the project data correctly', () => {
      const project = mockData[1];

      callComponentMethod(component, 'openDialogDescription', project);

      expect(component['dialog'].open).toHaveBeenCalledWith(
        DescriptionCardComponent,
        expect.objectContaining({
          data: { project },
        }),
      );
    });
  });

  describe('openDeleteDialog', () => {
    it('should open DeletePortfolioTileComponent dialog with correct config and data', () => {
      const project = mockData[0];
      const expectedConfig = {
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        width: '800px',
        data: { project },
      };

      callComponentMethod(component, 'openDeleteDialog', project);

      expect(component['dialog'].open).toHaveBeenCalledWith(DeletePortfolioTileComponent, expectedConfig);
    });

    it('should pass the project data correctly for regular projects', () => {
      const project = mockData[1];

      callComponentMethod(component, 'openDeleteDialog', project);

      expect(component['dialog'].open).toHaveBeenCalledWith(
        DeletePortfolioTileComponent,
        expect.objectContaining({
          data: { project },
        }),
      );
    });
  });

  describe('goToFeaturedPRojectsPage', () => {
    it('should navigate to featured projects page', () => {
      callComponentMethod(component, 'goToFeaturedPRojectsPage');

      expect(component['router'].navigate).toHaveBeenCalledWith(['/content/portfolio/featured-projects']);
    });
  });

  describe('Template Integration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render projects list', () => {
      const compiled = fixture.nativeElement;
      const projectItems = compiled.querySelectorAll('li');

      expect(projectItems.length).toBe(mockData.length + 1); // +1 for the "Add" button
    });

    it('should render project headings and descriptions', () => {
      const compiled = fixture.nativeElement;
      const headings = compiled.querySelectorAll('h3');
      const descriptions = compiled.querySelectorAll('p');

      expect(headings.length).toBe(mockData.length + 1); // +1 for the "Add" button
      expect(descriptions.length).toBe(mockData.length + 1); // +1 for the "Add" button

      expect(headings[0].textContent.trim()).toBe(mockData[0].viewHeading);
      expect(descriptions[0].textContent.trim()).toBe(mockData[0].viewDescription);
    });

    it('should render action buttons for each project', () => {
      const compiled = fixture.nativeElement;
      const actionButtons = compiled.querySelectorAll('.action-buttons');

      expect(actionButtons.length).toBe(mockData.length);
    });

    it('should render delete buttons for projects', () => {
      const compiled = fixture.nativeElement;
      const deleteButtons = compiled.querySelectorAll('button[color="accent"]');

      expect(deleteButtons.length).toBe(mockData.length);
      expect(deleteButtons[0]).toBeTruthy(); // Featured project button exists
      expect(deleteButtons[1]).toBeTruthy(); // Regular project button exists
    });

    it('should have delete buttons for projects', () => {
      const compiled = fixture.nativeElement;
      const deleteButtons = compiled.querySelectorAll('button[color="accent"]');

      expect(deleteButtons.length).toBe(mockData.length);
      expect(deleteButtons[0]).toBeTruthy(); // Featured project button exists
      expect(deleteButtons[1]).toBeTruthy(); // Regular project button exists
    });

    it('should have edit buttons for projects', () => {
      const compiled = fixture.nativeElement;
      const editButtons = compiled.querySelectorAll('button[color="primary"]');

      expect(editButtons.length).toBe(mockData.length);
      expect(editButtons[0]).toBeTruthy(); // First project edit button exists
      expect(editButtons[1]).toBeTruthy(); // Second project edit button exists
    });

    it('should render project action buttons', () => {
      const compiled = fixture.nativeElement;
      const actionButtons = compiled.querySelectorAll('.action-buttons');

      expect(actionButtons.length).toBe(mockData.length);
      expect(actionButtons[0]).toBeTruthy();
      expect(actionButtons[1]).toBeTruthy();
    });

    it('should render project images with correct attributes', () => {
      const compiled = fixture.nativeElement;
      const images = compiled.querySelectorAll('img');

      expect(images.length).toBe(mockData.length + 1); // +1 for the "Add" button
      expect(images[0].getAttribute('alt')).toBe('project');
      expect(images[0].title).toBe(getComponentProperty(component, 'toolTip'));
    });

    it('should render project images with correct attributes', () => {
      const compiled = fixture.nativeElement;
      const images = compiled.querySelectorAll('img');

      expect(images.length).toBe(mockData.length + 1); // +1 for the "Add" button

      // Check only the project images (exclude the "Add" button image)
      Array.from(images).slice(0, mockData.length)
        .forEach((img, index) => {
          const imageElement = img as HTMLImageElement;
          expect(imageElement.src).toContain(mockData[index].imageURL);
          expect(imageElement.alt).toBe('project');
          expect(imageElement.title).toBe(getComponentProperty(component, 'toolTip'));
        });
    });
  });

  describe('Store Integration', () => {
    it('should select portfolio cards from store', () => {
      const selectorSpy = jest.spyOn(store, 'selectSignal');

      // Re-initialize component to trigger selector
      fixture = TestBed.createComponent(PortfolioComponent);
      component = fixture.componentInstance;

      expect(selectorSpy).toHaveBeenCalledWith(portfolioCardsSelector);
    });

    it('should update when store data changes', () => {
      const newData: IProjectView[] = [
        {
          id: 3,
          imageURL: 'new-project.jpg',
          viewHeading: 'New Project',
          viewDescription: 'New project description',
        },
      ];

      store.overrideSelector(portfolioCardsSelector, newData);
      store.refreshState();

      expect((getComponentProperty(component, 'projectView') as () => IProjectView[])()).toEqual(newData);
    });
  });
});
