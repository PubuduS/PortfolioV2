import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';

import { portfolioCardsSelector } from '@portfolio-v2/state/selectors';
import { IProjectView } from '@portfolio-v2/state/dataModels';
import { PortfolioComponent } from './portfolio.component';

describe('PortfolioComponent', () => {
  let component: PortfolioComponent;
  let fixture: ComponentFixture<PortfolioComponent>;
  let store: MockStore;
  const mockData: IProjectView[] = [{
    id: 1,
    imageURL: 'some url',
    viewHeading: 'soem heading',
    viewDescription: 'some description',
  }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioComponent],
      providers: [
        provideMockStore(),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(portfolioCardsSelector, mockData);
    fixture = TestBed.createComponent(PortfolioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
