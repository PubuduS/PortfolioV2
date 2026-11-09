/** GSAP TweenMax, loaded only with the education flower. */
const TWEEN_MAX_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/2.0.1/TweenMax.min.js';

/** GSAP TimelineMax, loaded after TweenMax. */
const TIMELINE_MAX_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/2.0.1/TimelineMax.min.js';

/** Flower timeline. It expects TimelineMax on the page. */
const FLOWER_SRC = 'assets/scripts/flower.js';

/** Subresource integrity for the two CDN scripts. */
const SCRIPT_INTEGRITY: Record<string, string> = {
  [TWEEN_MAX_SRC]: 'sha512-bhcsCMe81HHWSpPwSB3iX7CP3ypfhlP9zFJMxB6Fk2SPPrY3+UYBYWcCoSVuDI7cMfFUXHuhzB4lXZfFLc32tA==',
  [TIMELINE_MAX_SRC]: 'sha512-wdpLNGAOerZ5GYBOb3R6QeNisPbo/bMFKDlZuVxO+cs/AZmKslep2nVsDuFlIMhFF/TFKxOQHI9YoTmaKm7kSg==',
};

/**
 * Append one script and wait for it.
 * @param src Script URL.
 * @returns Resolves when that script has loaded.
 */
function appendScript(src: string): Promise<void> {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    const integrity = SCRIPT_INTEGRITY[src];
    if (integrity) {
      script.integrity = integrity;
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
    }
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    document.body.appendChild(script);
  });
}

/**
 * Load the flower scripts in order. A script already on the page is left in place.
 * @returns Resolves when TweenMax, TimelineMax, and flower.js have loaded.
 */
export function loadFlowerScripts(): Promise<void> {
  return [TWEEN_MAX_SRC, TIMELINE_MAX_SRC, FLOWER_SRC].reduce(
    (chain, src) => chain.then(() => appendScript(src)),
    Promise.resolve(),
  );
}
