import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';

import {
  projectCardSelector,
  selectedCardIDSelector,
} from '@portfolio-v2/state/selectors';
import { IProjectCard } from '@portfolio-v2/state/dataModels';
import { ProjectCardsComponent } from './project-cards.component';

describe('ProjectCardsComponent', () => {
  let component: ProjectCardsComponent;
  let fixture: ComponentFixture<ProjectCardsComponent>;
  let store: MockStore;
  const mockProject: IProjectCard = {
    id: 1,
    heading: 'Test Project',
    description: 'Test project description',
    tools: 'Test tools',
    imageURL: 'https://example.com/image.jpg',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCardsComponent],
      providers: [
        provideMockStore({}),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(projectCardSelector(1), mockProject);
    store.overrideSelector(selectedCardIDSelector, 1);
    store.refreshState();
    fixture = TestBed.createComponent(ProjectCardsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
