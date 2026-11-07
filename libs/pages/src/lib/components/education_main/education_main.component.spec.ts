import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  provideRouter,
  Router,
} from '@angular/router';

import { FlowerAnimationComponent } from './components/flower/flower-animation.component';
import { EducationMainComponent } from './education_main.component';
import { loadFlowerScripts } from './flower-scripts';

jest.mock('./flower-scripts', () => ({
  loadFlowerScripts: jest.fn(() => Promise.resolve()),
}));

/**
 * Flower timeline installed by flower.js.
 * @returns The timeline function for the current test.
 */
function flowerAnimation(): jest.Mock {
  return (globalThis as { FlowerAnimation?: jest.Mock }).FlowerAnimation ?? jest.fn();
}

/**
 * Paths bound on the three flower tiles.
 * @param fixture Education hub fixture.
 * @returns Tile paths in page order.
 */
function tilePaths(fixture: ComponentFixture<EducationMainComponent>): string[] {
  return fixture.debugElement
    .queryAll(By.directive(FlowerAnimationComponent))
    .map((tile) => tile.componentInstance.routerPath);
}

describe('EducationMainComponent', () => {
  let fixture: ComponentFixture<EducationMainComponent>;

  beforeEach(async () => {
    (globalThis as { FlowerAnimation?: jest.Mock }).FlowerAnimation = jest.fn();
    jest.mocked(loadFlowerScripts).mockReset();
    jest.mocked(loadFlowerScripts).mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [EducationMainComponent],
      providers: [
        provideRouter([
          { path: 'content/education', children: [] },
          { path: 'admin/education', children: [] },
        ]),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(EducationMainComponent);
  });

  it('should start the flower timeline after its scripts load', async () => {
    fixture.detectChanges();
    await Promise.resolve();

    expect(loadFlowerScripts).toHaveBeenCalled();
    expect(flowerAnimation()).toHaveBeenCalled();
  });

  it('should skip the timeline when the page is gone before the scripts load', async () => {
    let finish = (): void => undefined;
    jest.mocked(loadFlowerScripts).mockImplementation(() => new Promise<void>((resolve) => {
      finish = resolve;
    }));
    fixture.detectChanges();
    fixture.destroy();
    finish();
    await Promise.resolve();

    expect(flowerAnimation()).not.toHaveBeenCalled();
  });

  describe('when the hub is the public page', () => {
    it('should link each tile to the public section', async () => {
      await TestBed.inject(Router).navigateByUrl('/content/education');
      fixture.detectChanges();

      expect(tilePaths(fixture)).toEqual([
        'content/education/publications',
        'content/education/degrees',
        'content/education/certificates',
      ]);
    });
  });

  describe('when the hub is the admin page', () => {
    it('should link each tile to the admin section', async () => {
      await TestBed.inject(Router).navigateByUrl('/admin/education');
      fixture.detectChanges();

      expect(tilePaths(fixture)).toEqual([
        'admin/education/publications',
        'admin/education/degrees',
        'admin/education/certificates',
      ]);
    });
  });
});
