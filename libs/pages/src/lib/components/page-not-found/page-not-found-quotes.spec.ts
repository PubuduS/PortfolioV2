import {
  NOT_FOUND_QUOTES_BY_DATE,
  SPECIAL_DATE_KEYS,
  quoteForLanding,
  quoteForLocalDate,
  quoteForRepeatVisit,
} from './page-not-found-quotes';

/**
 * Every local calendar day in a year.
 * @param year Full year, such as 2024.
 * @returns One date per day, in order.
 */
function datesInYear(year: number): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(year, 0, 1);
  while (cursor.getFullYear() === year) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

describe('quoteForLocalDate', () => {
  describe('when the year is a leap year', () => {
    it('should return a different line for every day, including February 29', () => {
      const lines = datesInYear(2024).map((date) => quoteForLocalDate(date));

      expect(lines).toHaveLength(366);
      expect(new Set(lines).size).toBe(366);
      expect(quoteForLocalDate(new Date(2024, 1, 29))).toBe(
        'Leap Day comes once every four years. You used yours to visit a page that isn\'t here.',
      );
    });
  });

  describe('when the year is not a leap year', () => {
    it('should skip the February 29 line', () => {
      const lines = datesInYear(2026).map((date) => quoteForLocalDate(date));

      expect(lines).toHaveLength(365);
      expect(lines).not.toContain(NOT_FOUND_QUOTES_BY_DATE['02-29']);
    });
  });

  describe('when the date is November 7', () => {
    it('should return the line mapped to that day', () => {
      expect(quoteForLocalDate(new Date(2026, 10, 7))).toBe(
        'A thankful heart is a happy heart. A working server is a happier server.',
      );
    });
  });
});

describe('quoteForRepeatVisit', () => {
  const specialLines = new Set(SPECIAL_DATE_KEYS.map((key) => NOT_FOUND_QUOTES_BY_DATE[key]));

  describe('when the day is ordinary', () => {
    const novemberSeventh = new Date(2026, 10, 7);

    it('should show that day\'s line on the first landing', () => {
      expect(quoteForRepeatVisit(novemberSeventh, 0)).toBe(quoteForLocalDate(novemberSeventh));
    });

    it('should walk forward through ordinary lines', () => {
      expect(quoteForRepeatVisit(novemberSeventh, 1)).toBe(NOT_FOUND_QUOTES_BY_DATE['11-08']);
      expect(quoteForRepeatVisit(novemberSeventh, 2)).toBe(NOT_FOUND_QUOTES_BY_DATE['11-09']);
    });

    it('should skip an occasion line that falls next', () => {
      expect(quoteForRepeatVisit(new Date(2026, 10, 10), 1)).toBe(NOT_FOUND_QUOTES_BY_DATE['11-12']);
    });

    it('should wrap past New Year without using the occasion lines', () => {
      expect(quoteForRepeatVisit(new Date(2026, 11, 30), 1)).toBe(NOT_FOUND_QUOTES_BY_DATE['01-02']);
    });

    it('should cycle through every ordinary line and no occasion line', () => {
      const ordinaryCount = Object.keys(NOT_FOUND_QUOTES_BY_DATE).length - SPECIAL_DATE_KEYS.length;
      const seen = new Set<string>();

      for (let visitIndex = 0; visitIndex < ordinaryCount; visitIndex += 1) {
        const line = quoteForRepeatVisit(novemberSeventh, visitIndex);
        seen.add(line);
        expect(specialLines.has(line)).toBe(false);
      }

      expect(seen.size).toBe(ordinaryCount);
    });
  });

  describe.each([
    ['Leap Day', new Date(2024, 1, 29)],
    ['April Fools', new Date(2026, 3, 1)],
    ['Christmas', new Date(2026, 11, 25)],
  ])('when the day is %s', (_label, date) => {
    it('should keep that day\'s line on every landing', () => {
      const line = quoteForLocalDate(date);

      expect(quoteForRepeatVisit(date, 0)).toBe(line);
      expect(quoteForRepeatVisit(date, 1)).toBe(line);
      expect(quoteForRepeatVisit(date, 8)).toBe(line);
    });
  });
});

describe('quoteForLanding', () => {
  /**
   * In-memory storage so the tests do not share the browser's visit memory.
   * @returns A Storage that keeps its own records.
   */
  function memoryStorage(): Storage {
    const records = new Map<string, string>();
    return {
      get length(): number {
        return records.size;
      },
      clear(): void {
        records.clear();
      },
      getItem(key: string): string | null {
        return records.get(key) ?? null;
      },
      key(index: number): string | null {
        return [...records.keys()][index] ?? null;
      },
      removeItem(key: string): void {
        records.delete(key);
      },
      setItem(key: string, value: string): void {
        records.set(key, value);
      },
    };
  }

  describe('when the day is ordinary', () => {
    it('should rotate on the next landing and start over on a new day', () => {
      const storage = memoryStorage();
      const firstDay = new Date(2026, 10, 7);
      const nextDay = new Date(2026, 10, 8);

      expect(quoteForLanding(firstDay, storage)).toBe(NOT_FOUND_QUOTES_BY_DATE['11-07']);
      expect(quoteForLanding(firstDay, storage)).toBe(NOT_FOUND_QUOTES_BY_DATE['11-08']);
      expect(quoteForLanding(nextDay, storage)).toBe(NOT_FOUND_QUOTES_BY_DATE['11-08']);
    });
  });

  describe('when the day is Christmas', () => {
    it('should keep the Christmas line and leave the next ordinary day on its own line', () => {
      const storage = memoryStorage();
      const christmas = new Date(2026, 11, 25);
      const ordinaryDay = new Date(2026, 11, 28);

      expect(quoteForLanding(christmas, storage)).toBe(NOT_FOUND_QUOTES_BY_DATE['12-25']);
      expect(quoteForLanding(christmas, storage)).toBe(NOT_FOUND_QUOTES_BY_DATE['12-25']);
      expect(quoteForLanding(ordinaryDay, storage)).toBe(NOT_FOUND_QUOTES_BY_DATE['12-28']);
    });
  });
});
