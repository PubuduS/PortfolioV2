import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  MockStore,
  provideMockStore,
} from '@ngrx/store/testing';

import { aboutMeSelector } from '@portfolio-v2/state/selectors';
import { IAboutMe } from '@portfolio-v2/state/dataModels';
import { AboutMeComponent } from './about_me.component';

describe('AboutMeComponent', () => {
  let component: AboutMeComponent;
  let fixture: ComponentFixture<AboutMeComponent>;
  let store: MockStore;
  const mockData: IAboutMe = {
    id: 1,
    heading: 'some heading',
    imageSrc: 'some url',
    intro: ['some intro1', 'another intro'],
    subHeading: 'some sub heading',
    subHeadingIntro: 'sub heading intro',
    leftPoints: ['point 1', 'point 2', 'point 3'],
    rightPoints: ['point 4', 'point 5', 'point 6'],
    link: 'some link',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutMeComponent],
      providers: [
        provideMockStore(),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(aboutMeSelector, mockData);
    fixture = TestBed.createComponent(AboutMeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
