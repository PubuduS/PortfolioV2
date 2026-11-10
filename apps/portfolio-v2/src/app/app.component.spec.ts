import { TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter } from '@angular/router';
import { MockComponent } from 'ng-mocks';

import { NavBarComponent } from '@portfolio-v2/shared/components';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        MockComponent(NavBarComponent),
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

  it('should use the subset icon font', () => {
    const icons = TestBed.inject(MatIconRegistry);
    const setFont = jest.spyOn(icons, 'setDefaultFontSetClass');

    TestBed.createComponent(AppComponent);

    expect(setFont).toHaveBeenCalledWith('material-symbols-outlined');
  });

  it('should publish the navbar height for the pages under it', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const header = fixture.nativeElement.querySelector('.pw-header-wrap');
    header.getBoundingClientRect = (): DOMRect => ({
      height: 104.5,
      width: 0,
      top: 0,
      left: 0,
      bottom: 104.5,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.documentElement.style.getPropertyValue('--site-header-height')).toBe('104.5px');
    document.documentElement.style.removeProperty('--site-header-height');
  });
});
