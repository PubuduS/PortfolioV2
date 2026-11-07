import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';

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

describe('EducationMainComponent', () => {
  let fixture: ComponentFixture<EducationMainComponent>;

  beforeEach(async () => {
    (globalThis as { FlowerAnimation?: jest.Mock }).FlowerAnimation = jest.fn();
    jest.mocked(loadFlowerScripts).mockReset();
    jest.mocked(loadFlowerScripts).mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [EducationMainComponent],
      providers: [provideRouter([])],
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
});
