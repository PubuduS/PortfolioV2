import { loadFlowerScripts } from './flower-scripts';

describe('loadFlowerScripts', () => {
  const scripts: HTMLScriptElement[] = [];

  beforeEach(() => {
    scripts.length = 0;
    const append = document.body.appendChild.bind(document.body);
    jest.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => {
      const script = node as HTMLScriptElement;
      scripts.push(script);
      const inserted = append(script);
      script.onload?.(new Event('load'));
      return inserted;
    });
  });

  afterEach(() => {
    document.querySelectorAll('script').forEach((script) => {
      const src = script.getAttribute('src') ?? '';
      if (src.includes('TweenMax') || src.includes('TimelineMax') || src.includes('flower.js')) {
        script.remove();
      }
    });
    jest.restoreAllMocks();
  });

  it('should load TweenMax, then TimelineMax, then the flower timeline', async () => {
    await loadFlowerScripts();

    expect(scripts.map((script) => script.getAttribute('src')?.split('/').pop())).toEqual([
      'TweenMax.min.js',
      'TimelineMax.min.js',
      'flower.js',
    ]);
    expect(scripts[0].integrity).toContain('sha512-');
  });

  it('should leave a script that is already on the page', async () => {
    await loadFlowerScripts();
    await loadFlowerScripts();

    expect(scripts).toHaveLength(3);
  });
});
