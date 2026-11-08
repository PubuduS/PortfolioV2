import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import {
provideRouter,
Router
} from '@angular/router'
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';

import { StateActions } from '@portfolio-v2/state';
import { IProjectView } from '@portfolio-v2/state/dataModels';
import { portfolioCardsSelector } from '@portfolio-v2/state/selectors';
import { PortfolioComponent } from './portfolio.component';
import { ProjectCardComponent } from './components/project_card/project_card.component';

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
        provideRouter([]),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(portfolioCardsSelector, mockData);
    jest.spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(PortfolioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should connect the portfolio tiles when the page opens', () => {
    expect(store.dispatch).toHaveBeenCalledWith(StateActions.portfolioCardsStateConnect());
  });

  describe('when a tile is chosen', () => {
    beforeEach(() => {
      store.overrideSelector(portfolioCardsSelector, [
        ...mockData,
        {
          id: 2,
          imageURL: 'other url',
          viewHeading: 'Other',
          viewDescription: 'another description',
        },
      ]);
      store.refreshState();
      fixture.detectChanges();
    });

    it('should open the featured projects page for the first tile', () => {
      const router = TestBed.inject(Router);
      jest.spyOn(router, 'navigate').mockResolvedValue(true);
      const [featured] = fixture.nativeElement.querySelectorAll('button');

      featured.click();

      expect(router.navigate).toHaveBeenCalledWith(['/content/portfolio/featured-projects']);
    });

    it('should open the project dialog for any other tile', () => {
      const {dialog} = component;
      jest.spyOn(dialog, 'open').mockReturnValue({} as ReturnType<MatDialog['open']>);
      const buttons = fixture.nativeElement.querySelectorAll('button');

      buttons[1].click();

      expect(store.dispatch).toHaveBeenCalledWith(
        StateActions.projectCardIDStateUpdated({ selectedProjectCardID: 2 }),
      );
      expect(dialog.open).toHaveBeenCalledWith(ProjectCardComponent, {
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      });
    });
  });
});
