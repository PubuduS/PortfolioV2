import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { ProjectCardsComponent } from './project-cards.component';

describe('ProjectCardsComponent', () => {
  let component: ProjectCardsComponent;
  let fixture: ComponentFixture<ProjectCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCardsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCardsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
