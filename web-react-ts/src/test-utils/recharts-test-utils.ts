/**
 * jsdom does not implement `ResizeObserver`, and every element's
 * `getBoundingClientRect()` reports 0×0. Recharts 3's `ResponsiveContainer`
 * refuses to render its children (including every `<Bar>`) until it measures
 * a positive width/height from `ResizeObserver` + `getBoundingClientRect()`.
 *
 * Separately, recharts 3's `<Bar>` entrance animation is driven by
 * `isAnimationActive="auto"`, which resolves to "animate" unless the
 * `prefers-reduced-motion: reduce` media query matches. Mid-animation, each
 * bar's rendered `height`/`width` interpolates from 0 — and recharts'
 * `<Rectangle>` shape renders `null` for a 0×0 box. jsdom has no
 * `requestAnimationFrame`-driven layout pass, so without disabling the
 * animation the bars would never reach their final (clickable, non-zero)
 * geometry inside a synchronous test. Mocking `matchMedia` to report
 * "reduced motion" makes recharts skip the animation and render bars at
 * their final geometry on the very first render.
 *
 * `setupRechartsJsdomEnv()` installs all three so `<ResponsiveContainer>`
 * and `<Bar>` render real, clickable SVG geometry synchronously on mount.
 * Call it once per test file (module scope, not per test) — chart tests
 * genuinely need real recharts rendering, not a mocked `<BarChart>`, to
 * catch the recharts-3 `payload` unwrap regression class (SYN-201).
 */
export function setupRechartsJsdomEnv(width = 800, height = 400) {
  class ResizeObserverMock {
    observe() {}

    unobserve() {}

    disconnect() {}
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global as any).ResizeObserver = ResizeObserverMock

  Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      width,
      height,
      top: 0,
      left: 0,
      bottom: height,
      right: width,
      x: 0,
      y: 0,
      toJSON: () => {},
    }),
  })

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
