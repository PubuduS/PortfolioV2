import { join } from 'node:path';
import { compileString } from 'sass';

const stylesDir = join(process.cwd(), 'libs/shared/src/lib/styles');

/**
 * Compile a fixture that uses the shared style module.
 * @param body rules under test
 * @returns the emitted CSS
 */
function compileFixture(body: string): string {
  return compileString(`@use 'styles' as *;\n${body}`, {
    loadPaths: [stylesDir],
  }).css;
}

describe('shared styles', () => {
  it('should keep the navy token', () => {
    const css = compileFixture('.swatch { color: $nocturne-navy; }');

    expect(css).toContain('color: #0a192f');
  });

  it('should clear the header with the shared offset', () => {
    const css = compileFixture('.offset { @include page-offset; }');

    expect(css).toContain('padding-block-start: var(--site-header-block)');
  });

  it('should give a section shell the same header offset', () => {
    const css = compileFixture('.shell { @include section-shell($midnigh-graphite); }');

    expect(css).toContain('padding-block-start: var(--site-header-block)');
    expect(css).toContain('background-color: #35495e');
  });

  it('should add wider layouts with min-width', () => {
    const css = compileFixture(`
      .wide {
        @include from-width(lg) {
          display: flex;
        }
      }
    `);

    expect(css).toContain('@media (min-width: 64rem)');
    expect(css).not.toContain('max-width');
  });

  it('should stack experience tabs until the lg breakpoint', () => {
    const css = compileFixture('.tabs { @include experience-tabs; }');

    expect(css).toContain('flex-direction: column');
    expect(css).toContain('@media (min-width: 64rem)');
    expect(css).toContain('flex-direction: row');
    expect(css).not.toContain('410px');
  });
});
