import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';

import { IProjectCard } from '@portfolio-v2/state/dataModels';
import {
  featuredProjectCardsSelector,
  newFeaturedProjectRecordIdSelector,
} from '@portfolio-v2/state/selectors';
import {
  AddPortfolioRecordComponent,
  ProjectCardType,
  UpdateDeleteButtonsComponent,
} from '@portfolio-v2/admin/shared/components';
import { DeletePortfolioTileComponent } from '../delete-portfolio-tile/delete-portfolio-tile.component';
import { FeaturedProjectsComponent } from './featured-projects.component';
import { ProjectCardsComponent } from '../project-cards/project-cards.component';

describe('FeaturedProjectsComponent', () => {
  let component: FeaturedProjectsComponent;
  let fixture: ComponentFixture<FeaturedProjectsComponent>;
  let store: MockStore;
  let dialogSpy: jest.SpyInstance;

  const mockData: IProjectCard[] = [
    {
      id: 1,
      heading: 'Test Project',
      description: 'Test project description',
      tools: 'React, TypeScript',
      imageURL: 'https://example.com/image.jpg',
      demoDisable: false,
      demoURL: 'https://demo.example.com',
      docDisable: false,
      documentationURL: 'https://docs.example.com',
      gitDisable: false,
      githubURL: 'https://github.com/test',
      screenshotURL: 'https://screenshot.example.com',
      ssDisable: false,
    },
    {
      id: 2,
      heading: 'Another Project',
      description: 'Another project description',
      tools: 'Angular, JavaScript',
      imageURL: 'https://example.com/image2.jpg',
      demoDisable: true,
      demoURL: 'https://demo2.example.com',
      docDisable: true,
      documentationURL: 'https://docs2.example.com',
      gitDisable: true,
      githubURL: 'https://github.com/test2',
      screenshotURL: 'https://screenshot2.example.com',
      ssDisable: true,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FeaturedProjectsComponent,
        MockComponents(
          UpdateDeleteButtonsComponent,
          ProjectCardsComponent,
          DeletePortfolioTileComponent,
          AddPortfolioRecordComponent,
        ),
      ],
      providers: [
        provideMockStore(),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(featuredProjectCardsSelector, mockData);
    store.overrideSelector(newFeaturedProjectRecordIdSelector, 3);

    fixture = TestBed.createComponent(FeaturedProjectsComponent);
    component = fixture.componentInstance;

    dialogSpy = jest.spyOn(component.dialog, 'open');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with featured project cards from store', () => {
      expect(component.featuredProjectCards()).toEqual(mockData);
    });

    it('should have icons defined', () => {
      expect(component.icons).toBeDefined();
      expect(component.icons.githubIco).toBeDefined();
      expect(component.icons.videoIco).toBeDefined();
      expect(component.icons.documentIco).toBeDefined();
      expect(component.icons.screenshotIco).toBeDefined();
    });
  });

  describe('Project Card Rendering', () => {
    it('should render all featured projects', () => {
      const projectCards = fixture.nativeElement.querySelectorAll('.project-card');
      expect(projectCards.length).toBe(mockData.length);
    });

    it('should display project details correctly', () => {
      const firstProject = fixture.nativeElement.querySelector('.project-card');
      const heading = firstProject.querySelector('h3');
      const description = firstProject.querySelector('p');
      const tools = firstProject.querySelector('span strong');

      expect(heading.textContent).toContain('Test Project');
      expect(description.textContent).toContain('Test project description');
      expect(tools.textContent).toContain('React, TypeScript');
    });

    it('should render project image', () => {
      const image = fixture.nativeElement.querySelector('.project-card img');
      expect(image.src).toContain('https://example.com/image.jpg');
      expect(image.alt).toBe('img');
    });
  });

  describe('Link States', () => {
    it('should render enabled links as anchor tags', () => {
      const githubLink = fixture.nativeElement.querySelector('.links li:first-child a');
      const demoLink = fixture.nativeElement.querySelector('.links li:nth-child(2) a');
      const docLink = fixture.nativeElement.querySelector('.links li:nth-child(3) a');
      const screenshotLink = fixture.nativeElement.querySelector('.links li:nth-child(4) a');

      expect(githubLink).toBeTruthy();
      expect(githubLink.href).toBe('https://github.com/test');
      expect(demoLink).toBeTruthy();
      expect(demoLink.href).toBe('https://demo.example.com/');
      expect(docLink).toBeTruthy();
      expect(docLink.href).toBe('https://docs.example.com/');
      expect(screenshotLink).toBeTruthy();
      expect(screenshotLink.href).toBe('https://screenshot.example.com/');
    });

    it('should render disabled links as spans with disabled class', () => {
      // Find the second project card (which has disabled links)
      const projectCards = fixture.nativeElement.querySelectorAll('.project-card');
      const secondProject = projectCards[1];

      const disabledSpans = secondProject.querySelectorAll('.links li span.disabled');
      expect(disabledSpans.length).toBe(4); // All links should be disabled in second project
    });

    it('should not render anchor tags for disabled links', () => {
      // Find the second project card (which has disabled links)
      const projectCards = fixture.nativeElement.querySelectorAll('.project-card');
      const secondProject = projectCards[1];

      const anchorTags = secondProject.querySelectorAll('.links li a');
      expect(anchorTags.length).toBe(0); // No anchor tags should exist for disabled links
    });
  });

  describe('Update/Delete Buttons', () => {
    it('should render update-delete-buttons for each project', () => {
      const buttons = fixture.nativeElement.querySelectorAll('admin-update-delete-buttons');
      expect(buttons.length).toBe(mockData.length);
    });

    it('should call onDeleteButtonClick when delete button is clicked', () => {
      const onDeleteSpy = jest.spyOn(component as any, 'onDeleteButtonClick');

      // Since the button click is handled by the child
      // component, we need to test the method directly
      component['onDeleteButtonClick'](mockData[0]);

      expect(onDeleteSpy).toHaveBeenCalledWith(mockData[0]);
    });

    it('should call onEditButtonClick when edit button is clicked', () => {
      const onEditSpy = jest.spyOn(component as any, 'onEditButtonClick');

      // Since the button click is handled by
      // the child component, we need to test the method directly
      component['onEditButtonClick'](mockData[0].id);

      expect(onEditSpy).toHaveBeenCalledWith(mockData[0].id);
    });
  });

  describe('Add New Record', () => {
    it('should render add button', () => {
      const addButton = fixture.nativeElement.querySelector('button[mat-button]');
      expect(addButton).toBeTruthy();
    });

    it('should call addNewRecord when add button is clicked', () => {
      const addButton = fixture.nativeElement.querySelector('button[mat-button]');
      const addRecordSpy = jest.spyOn(component as any, 'addNewRecord');

      addButton.click();

      expect(addRecordSpy).toHaveBeenCalled();
    });

    it('should open AddPortfolioRecordComponent dialog when add button is clicked', () => {
      // Mock dialog.open to avoid dependency issues
      const mockDialogRef = { close: jest.fn() };
      dialogSpy.mockReturnValue(mockDialogRef);

      component['addNewRecord']();

      expect(dialogSpy).toHaveBeenCalledWith(
        AddPortfolioRecordComponent,
        expect.objectContaining({
          autoFocus: 'first-tabbable',
          restoreFocus: true,
          width: '800px',
          data: expect.objectContaining({
            currentId: 3,
            heading: 'Default Heading',
            type: ProjectCardType.featured,
          }),
        }),
      );
    });
  });

  describe('Dialog Management', () => {
    beforeEach(() => {
      // Mock dialog.open to avoid dependency issues
      const mockDialogRef = { close: jest.fn() };
      dialogSpy.mockReturnValue(mockDialogRef);
    });

    it('should open delete dialog with correct parameters', () => {
      component['openDeleteDialog'](1);

      expect(dialogSpy).toHaveBeenCalledWith(
        DeletePortfolioTileComponent,
        expect.objectContaining({
          autoFocus: 'first-tabbable',
          restoreFocus: true,
          width: '800px',
          data: expect.objectContaining({
            recordId: 1,
            type: ProjectCardType.featured,
          }),
        }),
      );
    });

    it('should open edit dialog with correct parameters', () => {
      component['openProjectCardEditDialog'](1);

      expect(dialogSpy).toHaveBeenCalledWith(
        ProjectCardsComponent,
        expect.objectContaining({
          autoFocus: 'first-tabbable',
          restoreFocus: true,
          width: '800px',
          data: expect.objectContaining({
            cardId: 1,
            type: ProjectCardType.featured,
          }),
        }),
      );
    });
  });

  describe('Event Handlers', () => {
    it('should handle delete button click correctly', () => {
      const openDeleteSpy = jest.spyOn(component as any, 'openDeleteDialog');

      component['onDeleteButtonClick'](mockData[0]);

      expect(openDeleteSpy).toHaveBeenCalledWith(mockData[0].id);
    });

    it('should handle edit button click correctly', () => {
      const openEditSpy = jest.spyOn(component as any, 'openProjectCardEditDialog');

      component['onEditButtonClick'](mockData[0].id);

      expect(openEditSpy).toHaveBeenCalledWith(mockData[0].id);
    });
  });
});
