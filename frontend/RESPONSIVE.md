# Responsive layouts

Existing pages and exercise behavior share the same themes and data. Layout changes use available viewport space, not device detection.

- Below 1280px, navigation opens over the page in a drawer. Exercise routes use their own back/progress controls and hide the global header and drawer.
- At 1280px and above, the app sidebar is persistent. Write, Spell, and Test results can display their progress beside the exercise.
- At 768px, recent modules use two columns and search fits into the header row. Study-mode links and answer choices use two columns from 640px.
- The editor stacks term and definition fields below 1280px. Its sticky action bar uses the shared header-height variable rather than an independent offset.
- Flashcards size against the dynamic viewport height. Long card content scrolls inside the card, keeping rating controls outside it.
- Import content scrolls independently of its action footer. Touch devices have larger icon targets and inputs of at least 16px.

Run `npm run test:e2e:responsive` from `frontend/`. This starts an isolated read-only fixture API on port 3101 and a Next development server on port 3100; it does not use real account data. Stop another local Next development process in this checkout first, because Next shares its development output directory.

The suite covers 320px and 390px phones, 768px portrait and 1024px landscape tablets, 1440px desktop, and 820px iPad WebKit. It checks all existing page types, long content, navigation, editor scrolling/import, card interactions, mixed test questions/results, and resizing without losing study state. Screenshots are written to ignored `test-results/` directories.

Browser emulation does not reproduce an actual iPad software keyboard or browser toolbar; physical-device testing is still useful for those behaviors.
