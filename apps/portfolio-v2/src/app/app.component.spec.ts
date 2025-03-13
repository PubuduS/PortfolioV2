import { TestBed } from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';
import { provideRouter } from '@angular/router';

import { WeatherDisplayComponent } from '@portfolio-v2/shared/components';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        MockComponent(WeatherDisplayComponent),
      ],
      providers: [
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('should have as title \'Pubudu Wijesooriya\'', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Pubudu Wijesooriya');
  });
});
