import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';

import { IProjectCard } from '@portfolio-v2/state/dataModels';
import { featuredProjectCardsSelector } from '@portfolio-v2/state/selectors';
import { FeaturedProjectsComponent } from './featured_projects.component';

describe('FeaturedProjectsComponent', () => {
  let component: FeaturedProjectsComponent;
  let fixture: ComponentFixture<FeaturedProjectsComponent>;
  let store: MockStore;
  const mockData: IProjectCard[] = [{
    id: 1,
    heading: 'some position',
    description: 'some employer',
    tools: 'tool1, tool2, tool3',
    imageURL: 'some url',
    demoDisable: false,
    demoURL: 'some url',
    docDisable: false,
    documentationURL: 'some url',
    gitDisable: false,
    githubURL: 'some url',
    screenshotURL: 'some url',
    ssDisable: false,
  }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturedProjectsComponent],
      providers: [
        provideMockStore(),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(featuredProjectCardsSelector, mockData);
    fixture = TestBed.createComponent(FeaturedProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
