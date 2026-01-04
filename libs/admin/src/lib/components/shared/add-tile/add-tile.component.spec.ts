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
} from '@portfolio-v2/state/selectors';
import { AddTileComponent } from './add-tile.component';
import { AddPortfolioRecordComponent } from '../add-portfolio-record/add-portfolio-record.component';
import { newProjectRecordIdSelector } from '../selectors/new-project-record-id.selector';

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
    store.overrideSelector(newProjectRecordIdSelector, 2);
    store.refreshState();

    fixture = TestBed.createComponent(AddTileComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
