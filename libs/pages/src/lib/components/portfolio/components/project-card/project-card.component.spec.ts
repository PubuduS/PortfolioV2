import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';

import {
  StateActions,
  StoreState,
} from '@portfolio-v2/state';
import { ProjectCardComponent } from './project-card.component';

/**
 * @param projectCards stored project records
 * @returns a mock root state
 */
function stateBanks(projectCards: StoreState['projectCards']): { stateBanks: StoreState } {
  return {
    stateBanks: {
      selectedProjectCardID: 1,
      selectedPublicationID: 0,
      isAdmin: false,
      isPreviewMode: false,
      isPartyMode: false,
      projectCards,
    },
  };
}

describe('ProjectCardComponent', () => {
  let fixture: ComponentFixture<ProjectCardComponent>;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCardComponent],
      providers: [provideMockStore({ initialState: stateBanks([]) })],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    jest.spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(ProjectCardComponent);
    fixture.detectChanges();
  });

  it('should connect project cards when the dialog opens', () => {
    expect(store.dispatch).toHaveBeenCalledWith(StateActions.projectCardsStateConnect());
  });
});
