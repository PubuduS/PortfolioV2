import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import {
  isSpecialDate,
  quoteForLocalDate,
  quoteForRepeatVisit,
} from './page-not-found-quotes';
import { PageNotFoundComponent } from './page_not_found.component';

describe('PageNotFoundComponent', () => {
  let component: PageNotFoundComponent;
  let fixture: ComponentFixture<PageNotFoundComponent>;

  /**
   * Read the quote shown in the heading.
   * @param current Fixture whose heading should be read.
   * @returns The heading words joined into one line.
   */
  function shownQuote(current: ComponentFixture<PageNotFoundComponent>): string {
    return [...current.nativeElement.querySelectorAll<HTMLSpanElement>('h1.quote span')]
      .map((word) => word.textContent)
      .join(' ');
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PageNotFoundComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PageNotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the line for today', () => {
    expect(shownQuote(fixture)).toBe(quoteForLocalDate(new Date()));
  });

  it('should rotate after another landing on an ordinary day', () => {
    const today = new Date();
    const again = TestBed.createComponent(PageNotFoundComponent);
    again.detectChanges();

    if (isSpecialDate(today)) {
      expect(shownQuote(again)).toBe(quoteForLocalDate(today));
      return;
    }

    expect(shownQuote(again)).toBe(quoteForRepeatVisit(today, 1));
  });
});
