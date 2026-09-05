# SpeakMate Mobile UX Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade SpeakMate into a predictable mobile-app experience with consistent navigation, recoverable scene filters, unobscured speech/text controls, complete installation help, and verified iPhone/WebKit behavior.

**Architecture:** Add a small shared mobile-navigation layer, make scene-filter URLs the public source of truth, and derive fixed practice controls directly from the existing practice state machine. Preserve the current Dialogue Stage visual system and IndexedDB/AI contracts while tightening page composition, focus, scroll, safe-area, and service-worker update behavior.

**Tech Stack:** Next.js 16.3.4 App Router, React 19.2.8, TypeScript 5.9.3, CSS Modules, Zustand 5.0.15, IndexedDB via `idb`, Vitest 4.1.11, Testing Library, jest-axe, Playwright 1.62.1, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-05-speakmate-mobile-ux-consistency-design.md`

## Global Constraints

- Preserve the Atlantic/Sky/Coral palette, Barlow Condensed headings, Phosphor icon set, existing scene imagery, and `design-system/speakmate/MASTER.md` visual direction.
- Keep exactly three primary destinations: Practice `/practice`, Scenes `/scenes`, and Me `/me`.
- Keep all tap targets at least `44px × 44px` with at least `8px` between adjacent independent targets.
- Keep the app usable from `320 × 568` through `430 × 932`, at `844 × 390` landscape, and at `768 × 1024` tablet size.
- Preserve `viewport-fit=cover`, browser zoom, safe-area insets, 200% text sizing, reduced motion, and keyboard-only operation.
- Do not add a UI library, gesture library, route-transition library, list virtualization, custom SVG, emoji icon, new brand color, payment feature, or AI-provider change.
- Do not change the IndexedDB schema, scene content versions, API request/response contracts, or session idempotency behavior.
- Use App Router APIs exactly as documented in `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`, `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md`, and `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`.
- Implement every behavioral change test-first: add a failing test, observe the expected failure, implement the smallest passing change, rerun the focused test, then rerun the affected suite.
- Do not claim zero bugs. Release only when all specified checks pass and no known high-priority defect remains.

---

## File Structure

### New files

- `src/components/app-shell/navigation-history.ts`: pure same-origin route-stack transitions and safe-back decisions.
- `src/components/app-shell/navigation-history.test.ts`: route-stack unit tests.
- `src/components/app-shell/route-coordinator.tsx`: observes App Router locations, manages forward focus and route announcements.
- `src/components/app-shell/smart-back-link.tsx`: history-aware back control with a deterministic fallback.
- `src/components/app-shell/mobile-page-header.tsx`: shared secondary-page header.
- `src/components/app-shell/mobile-page-header.module.css`: shared header and 44px back-target styles.
- `src/components/app-shell/scroll-to-top-button.tsx`: accessible long-list escape action.
- `src/features/scenes/scene-filter-state.ts`: parse, normalize, serialize, and summarize scene filters.
- `src/features/scenes/scene-filter-state.test.ts`: filter contract tests.
- `src/features/scenes/scene-library-route.tsx`: loads the profile fallback level and synchronizes SceneLibrary with URL state.
- `src/features/scenes/horizontal-filter-group.tsx`: accessible horizontal filter strip with edge affordances.
- `src/features/practice/exit-guard.tsx`: guarded browser/standalone-app exit confirmation.
- `src/features/practice/exit-guard.test.tsx`: exit-guard state and dialog tests.
- `src/features/practice/text-review-dock.tsx`: keyboard-safe transcript confirmation dock.
- `src/features/practice/text-review-dock.module.css`: dynamic-viewport and safe-area layout.
- `src/components/feedback-sheet/feedback-sheet.test.tsx`: expansion semantics and visibility tests.
- `src/features/practice/session-report-view.test.tsx`: rendered report navigation and accessibility tests.
- `tests/e2e/navigation.spec.ts`: primary, secondary, deep-link, and history navigation coverage.
- `tests/e2e/scene-filters.spec.ts`: URL, horizontal-scroll, return-state, and scroll restoration coverage.
- `tests/e2e/mobile-controls.spec.ts`: fixed-layer, keyboard-mode, feedback, safe-area, and touch-target coverage.

### Existing files to modify

- `src/app/layout.tsx`: mount route coordination after page content.
- `src/app/globals.css`: global scroll-padding, reduced-motion, and fixed-layer variables.
- `src/styles/tokens.css`: named header, dock, and z-index tokens.
- `src/components/app-shell/app-shell.tsx`: identify top-level page content for route focus.
- `src/components/app-shell/app-shell.module.css`: bottom-nav spacing and fixed-layer compatibility.
- `src/components/app-shell/app-shell.test.tsx`: shared-header and shell accessibility tests.
- `src/components/install-prompt/service-worker-registration.tsx`: safe-route update Snackbar and per-version dismissal.
- `src/components/install-prompt/service-worker-registration.module.css`: non-obscuring bottom placement.
- `src/components/install-prompt/install-prompt.tsx`: always-available iPhone/Android installation guide.
- `src/components/install-prompt/install-prompt.test.tsx`: unknown-platform, standalone, and tab tests.
- `src/features/scenes/scene-library.tsx`: controlled initial filter state and result behavior.
- `src/features/scenes/scene-filters.tsx`: `aria-pressed`, horizontal groups, and clear action.
- `src/features/scenes/scene-card.tsx`: make the full card a link and carry the source URL.
- `src/features/scenes/scene-library.module.css`: scroll masks, 44px chips, sticky summary, and card-link styles.
- `src/features/scenes/scene-library.test.tsx`: controlled-state and accessibility tests.
- `src/features/scenes/scene-preparation.tsx`: shared top header and source-aware back route.
- `src/features/scenes/scene-preparation.module.css`: header-safe hero and sticky-CTA spacing.
- `src/features/onboarding/onboarding-flow.tsx`: top back control and `aria-pressed` selection states.
- `src/features/onboarding/onboarding-flow.module.css`: mobile header and action sizing.
- `src/features/onboarding/onboarding-flow.test.tsx`: step-back and selected-state tests.
- `src/features/practice/practice-stage.tsx`: mode-derived dock, guarded exit, and feedback visibility.
- `src/features/practice/practice-stage.module.css`: mode-specific bottom spacing and 44px exit target.
- `src/features/practice/practice-stage.test.tsx`: speech/text dock, guard, processing, and completion tests.
- `src/components/feedback-sheet/feedback-sheet.tsx`: expose toggle/content refs and stable control relationship.
- `src/components/feedback-sheet/feedback-sheet.module.css`: scroll-margin above fixed dock.
- `src/features/practice/session-report.tsx`: shared report back header and explicit terminal actions.
- `src/features/practice/session-report.module.css`: header and bottom-action safe-area spacing.
- `src/features/profile/learning-center.tsx`: preserve current query context when entering settings.
- `src/app/scenes/page.tsx`: render the route-aware scene library.
- `src/app/scenes/[slug]/page.tsx`: parse and pass the source route.
- `src/app/install/page.tsx`: render shared header and persistent installation guide.
- `src/app/privacy/page.tsx`: replace local header markup with shared header.
- `src/app/auth/page.tsx`: add shared header.
- `src/app/welcome/page.tsx`: distinguish first-run and settings entry.
- `tests/e2e/first-session.spec.ts`: assert keyboard-mode visibility and report navigation.
- `tests/e2e/responsive.spec.ts`: add 320px, fixed-layer, target-size, and long-list assertions.
- `tests/e2e/accessibility.spec.ts`: route focus, filter state, and dialog semantics.
- `package.json`: bump the app version after verification.
- `public/sw.js`: bump the named cache/version only after the new build passes locally.
- `README.md`, `APP_SPEC.md`, `docs/DEPLOYMENT.md`, `design-qa.md`: record implemented UX contract, test evidence, and deployment revision.

---

### Task 1: Shared Mobile Navigation Foundation

**Files:**
- Create: `src/components/app-shell/navigation-history.ts`
- Create: `src/components/app-shell/navigation-history.test.ts`
- Create: `src/components/app-shell/route-coordinator.tsx`
- Create: `src/components/app-shell/smart-back-link.tsx`
- Create: `src/components/app-shell/mobile-page-header.tsx`
- Create: `src/components/app-shell/mobile-page-header.module.css`
- Modify: `src/components/app-shell/app-shell.tsx`
- Modify: `src/components/app-shell/app-shell.module.css`
- Modify: `src/components/app-shell/app-shell.test.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: `trackRoute(stack: string[], nextRoute: string): { stack: string[]; kind: 'same' | 'forward' | 'back' }`.
- Produces: `canGoBackWithinApp(stack: string[]): boolean`.
- Produces: `<SmartBackLink fallbackHref ariaLabel guardState? onGuardedBack?>`.
- Produces: `<MobilePageHeader title eyebrow? fallbackHref trailing?>`.
- Produces: `<RouteCoordinator />` mounted once in the root layout.
- Consumes: Next.js `usePathname`, `useSearchParams`, and `useRouter`; existing tokens and Phosphor icons.

- [ ] **Step 1: Read the repository-specific Next.js navigation documentation**

Run:

```powershell
Get-Content node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md
Get-Content node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md
Get-Content node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md
```

Expected: confirm current App Router behavior for `Link`, `router.back()`, `router.replace()`, and Suspense requirements around `useSearchParams()`.

- [ ] **Step 2: Write failing route-stack tests**

Add:

```ts
import { describe, expect, it } from 'vitest'
import { canGoBackWithinApp, trackRoute } from './navigation-history'

describe('navigation history', () => {
  it('records a forward route and identifies browser-back restoration', () => {
    const forward = trackRoute(['/scenes?level=B1'], '/scenes/hotel-check-in?level=B1')
    expect(forward).toEqual({
      stack: ['/scenes?level=B1', '/scenes/hotel-check-in?level=B1'],
      kind: 'forward',
    })
    expect(trackRoute(forward.stack, '/scenes?level=B1')).toEqual({
      stack: ['/scenes?level=B1'],
      kind: 'back',
    })
  })

  it('does not claim a safe in-app back route for a direct deep link', () => {
    expect(canGoBackWithinApp(['/privacy'])).toBe(false)
  })
})
```

- [ ] **Step 3: Run the focused test and observe the missing-module failure**

Run: `pnpm vitest run src/components/app-shell/navigation-history.test.ts`

Expected: FAIL because `navigation-history.ts` does not exist.

- [ ] **Step 4: Implement the pure route-stack contract**

Use:

```ts
const MAX_ROUTES = 24

export function trackRoute(stack: string[], nextRoute: string) {
  if (stack.at(-1) === nextRoute) return { stack, kind: 'same' as const }
  if (stack.at(-2) === nextRoute) {
    return { stack: stack.slice(0, -1), kind: 'back' as const }
  }
  return {
    stack: [...stack, nextRoute].slice(-MAX_ROUTES),
    kind: 'forward' as const,
  }
}

export function canGoBackWithinApp(stack: string[]) {
  return stack.length > 1
}
```

- [ ] **Step 5: Add the route coordinator and shared controls**

`RouteCoordinator` must read/write only `sessionStorage['speakmate-route-stack']`, compute `pathname + searchParams`, focus `[data-page-title]` on `forward`, leave focus and scroll untouched on `back`, and expose one polite hidden route-announcement region. `SmartBackLink` must render a real fallback `Link`; its click handler prevents default and calls `router.back()` only when the stored stack has at least two entries, otherwise normal link navigation uses `fallbackHref`.

The header shape must be:

```tsx
<header className={styles.header}>
  <SmartBackLink fallbackHref={fallbackHref} ariaLabel={`返回${title}`} />
  <div>
    {eyebrow ? <p>{eyebrow}</p> : null}
    <h1 data-page-title tabIndex={-1}>{title}</h1>
  </div>
  {trailing ? <div className={styles.trailing}>{trailing}</div> : null}
</header>
```

Mount `<RouteCoordinator />` after `{children}` in `src/app/layout.tsx`, wrapped in `<Suspense fallback={null}>` because it reads `useSearchParams()`. Add `data-page-title` to each top-level page heading during the later page tasks.

- [ ] **Step 6: Add component tests for navigation count, active state, header naming, and axe**

Add assertions equivalent to:

```ts
render(<MobilePageHeader title="隐私与数据" fallbackHref="/me" />)
expect(screen.getByRole('link', { name: '返回隐私与数据' })).toBeVisible()
expect(screen.getByRole('heading', { name: '隐私与数据' })).toHaveAttribute('data-page-title')
expect((await axe(container)).violations).toEqual([])
```

- [ ] **Step 7: Run focused and shell tests**

Run:

```powershell
pnpm vitest run src/components/app-shell/navigation-history.test.ts src/components/app-shell/app-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit the navigation foundation**

```powershell
git add src/components/app-shell src/app/layout.tsx
git commit -m "feat: add mobile navigation foundation"
```

---

### Task 2: URL-Backed Scene Filter State

**Files:**
- Create: `src/features/scenes/scene-filter-state.ts`
- Create: `src/features/scenes/scene-filter-state.test.ts`
- Create: `src/features/scenes/scene-library-route.tsx`
- Modify: `src/features/scenes/scene-library.tsx`
- Modify: `src/features/scenes/scene-library.test.tsx`
- Modify: `src/app/scenes/page.tsx`

**Interfaces:**
- Produces: `SceneFilterState = { search: string; category: SceneCategory | 'all'; level: CefrLevel; duration: DurationFilter }`.
- Produces: `parseSceneFilterState(params: URLSearchParams, fallbackLevel: CefrLevel): SceneFilterState`.
- Produces: `serializeSceneFilterState(state: SceneFilterState): string`.
- Produces: `sceneLibraryHref(state: SceneFilterState): string`.
- Consumes: `Repositories['profiles']`, `CEFR_LEVELS`, the scene-category union, and Next App Router query APIs.

Move `DurationFilter` from `scene-library.tsx` into `scene-filter-state.ts` so the route wrapper, parser, filters, and library share one dependency without a circular import.

- [ ] **Step 1: Write failing parser and serializer tests**

```ts
it('uses a saved B1 level when the URL has no level', () => {
  expect(parseSceneFilterState(new URLSearchParams(), 'B1')).toEqual({
    search: '', category: 'all', level: 'B1', duration: 'all',
  })
})

it('normalizes invalid public parameters without throwing', () => {
  const state = parseSceneFilterState(
    new URLSearchParams('q=hotel&category=wrong&level=Z9&duration=99'),
    'B2',
  )
  expect(state).toEqual({ search: 'hotel', category: 'all', level: 'B2', duration: 'all' })
})

it('serializes only meaningful values in a stable order', () => {
  expect(serializeSceneFilterState({ search: '', category: 'social', level: 'B1', duration: 5 }))
    .toBe('category=social&level=B1&duration=5')
})
```

- [ ] **Step 2: Run and observe the missing-contract failure**

Run: `pnpm vitest run src/features/scenes/scene-filter-state.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement strict parsing and stable serialization**

Use explicit allowlists:

```ts
const categories = ['travel', 'dining', 'daily', 'work', 'social', 'study', 'emergency'] as const
const durations = [3, 5, 8, 10] as const

export function sceneLibraryHref(state: SceneFilterState) {
  const query = serializeSceneFilterState(state)
  return query ? `/scenes?${query}` : '/scenes'
}
```

Search text must be trimmed for serialization but remain unchanged while the user is typing. Reject invalid enum values without logging the raw query.

- [ ] **Step 4: Write a failing route-wrapper test for profile fallback and URL precedence**

Provide a memory repository whose profile is B1, render `SceneLibraryRoute` with no level, and assert the B1 button is pressed. Render again with `level=C1` and assert C1 wins.

```ts
expect(await screen.findByRole('button', { name: 'B1' })).toHaveAttribute('aria-pressed', 'true')
expect(screen.getByText(/当前 B1/)).toBeVisible()
```

- [ ] **Step 5: Implement `SceneLibraryRoute`**

The wrapper must:

1. Read query params.
2. If `level` is valid, render immediately with that level.
3. Otherwise load `ensureGuestProfile()` and hold a stable `aria-busy="true"` scene-library skeleton until resolved.
4. Use `router.replace(sceneLibraryHref(next), { scroll: false })` for filter changes.
5. Debounce search-only URL writes by 250 ms and cancel the timer on unmount.

Do not render A2 before the stored profile resolves.

- [ ] **Step 6: Refactor `SceneLibrary` to accept initial state and emit changes**

Use this boundary:

```ts
interface SceneLibraryProps {
  initialState: SceneFilterState
  onStateChange?(state: SceneFilterState, source: 'search' | 'filter'): void
}
```

Keep the existing scene adaptation and filtering logic. Update state only through a helper that calls `onStateChange` with the complete next state.

- [ ] **Step 7: Run scene-state and library tests**

Run:

```powershell
pnpm vitest run src/features/scenes/scene-filter-state.test.ts src/features/scenes/scene-library.test.tsx
```

Expected: PASS, including B1 profile fallback and URL C1 precedence.

- [ ] **Step 8: Commit URL-backed scene state**

```powershell
git add src/features/scenes src/app/scenes/page.tsx
git commit -m "feat: persist scene filters in the URL"
```

---

### Task 3: Mobile-Friendly Scene Discovery and Return State

**Files:**
- Create: `src/features/scenes/horizontal-filter-group.tsx`
- Create: `src/components/app-shell/scroll-to-top-button.tsx`
- Modify: `src/features/scenes/scene-filters.tsx`
- Modify: `src/features/scenes/scene-card.tsx`
- Modify: `src/features/scenes/scene-library.tsx`
- Modify: `src/features/scenes/scene-library.module.css`
- Modify: `src/features/scenes/scene-library.test.tsx`
- Modify: `src/features/scenes/scene-preparation.tsx`
- Modify: `src/features/scenes/scene-preparation.module.css`
- Modify: `src/app/scenes/[slug]/page.tsx`
- Create: `tests/e2e/scene-filters.spec.ts`

**Interfaces:**
- Produces: `<HorizontalFilterGroup label selectedValue children>` with `data-at-start` and `data-at-end` scroll state.
- Produces: `<ScrollToTopButton thresholdViewports={2} />`.
- `SceneCard` consumes `sourceHref: string` and appends `from=encodeURIComponent(sourceHref)` to the detail URL.
- `ScenePreparation` consumes `backHref: string` and renders `MobilePageHeader`.

- [ ] **Step 1: Write failing component tests for selected state, clear recovery, and full-card linking**

```ts
expect(screen.getByRole('button', { name: '社交' })).toHaveAttribute('aria-pressed', 'true')
expect(screen.getByRole('button', { name: '清除筛选' })).toBeVisible()
expect(screen.getByRole('link', { name: '准备练习：初次寒暄' }))
  .toHaveAttribute('href', expect.stringContaining('from=%2Fscenes'))
```

For a no-results search, assert the empty state contains exactly one recovery action named “清除筛选”.

- [ ] **Step 2: Run the focused SceneLibrary test and observe failures**

Run: `pnpm vitest run src/features/scenes/scene-library.test.tsx`

Expected: FAIL on missing `aria-pressed`, clear action, and source route.

- [ ] **Step 3: Implement horizontal filter groups**

The component must set edge state from `scrollLeft`, `clientWidth`, and `scrollWidth`, update on `scroll` and `ResizeObserver`, and center the active button when `selectedValue` changes:

```ts
activeRef.current?.scrollIntoView({
  behavior: reduceMotion ? 'auto' : 'smooth',
  block: 'nearest',
  inline: 'center',
})
```

CSS must provide 44px-high chips, `scroll-snap-type: inline proximity`, `overscroll-behavior-inline: contain`, hidden decorative scrollbar, and start/end gradient masks that disappear at their respective edges.

- [ ] **Step 4: Implement the filter summary and recovery action**

The result bar must say, for example, “6 个匹配场景 · 当前 B1 · 社交 · 5 分钟” and expose “清除筛选” only when search, category, or duration differs from the defaults. Clearing keeps the active level.

- [ ] **Step 5: Make each scene card one complete link**

Use a single wrapping `Link` around the card content. Keep `<article data-testid="scene-card">` inside the link, retain the existing arrow icon as decoration, and avoid nested interactive elements.

- [ ] **Step 6: Add source-aware scene preparation navigation**

Parse `from` only when it begins with `/scenes`; otherwise use `/scenes?level=${scene.level}`. Render:

```tsx
<MobilePageHeader
  title={scene.titleZh}
  eyebrow="SCENE BRIEF"
  fallbackHref={backHref}
/>
```

Keep the current hero as the first content block below the header. Give the sticky CTA enough trailing page space to remain unobscured.

- [ ] **Step 7: Add the long-list return-to-top control**

Show after `window.scrollY > window.innerHeight * 2`, place it above the bottom navigation and safe area, label it “返回顶部”, and use instant scrolling under reduced motion.

- [ ] **Step 8: Write E2E tests for horizontal and historical restoration**

```ts
await page.goto('/scenes?category=social&level=B1&duration=5')
await expect(page.getByRole('button', { name: '社交' })).toHaveAttribute('aria-pressed', 'true')
await page.getByRole('link', { name: /准备练习：初次寒暄/ }).click()
await page.getByRole('link', { name: /返回/ }).click()
await expect(page).toHaveURL(/category=social.*level=B1.*duration=5/)
await expect(page.getByRole('button', { name: '社交' })).toHaveAttribute('aria-pressed', 'true')
```

Also assert `document.documentElement.scrollWidth - clientWidth <= 1` at 360, 390, 430, 768, and 844-landscape widths.

- [ ] **Step 9: Run focused unit and Chromium E2E tests**

Run:

```powershell
pnpm vitest run src/features/scenes/scene-library.test.tsx
pnpm playwright test tests/e2e/scene-filters.spec.ts --project=chromium-mobile
```

Expected: PASS.

- [ ] **Step 10: Commit scene discovery UX**

```powershell
git add src/features/scenes src/components/app-shell/scroll-to-top-button.tsx src/app/scenes tests/e2e/scene-filters.spec.ts
git commit -m "feat: improve mobile scene discovery"
```

---

### Task 4: Non-Obscuring PWA Update Snackbar

**Files:**
- Modify: `src/components/install-prompt/service-worker-registration.tsx`
- Modify: `src/components/install-prompt/service-worker-registration.module.css`
- Create: `src/components/install-prompt/service-worker-registration.test.tsx`
- Modify: `src/styles/tokens.css`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `shouldShowUpdate(pathname: string, interactionBusy: boolean): boolean`.
- Uses: `sessionStorage['speakmate-update-dismissed-worker']` keyed by waiting-worker script URL or a stable fallback version.
- Consumes: App Router pathname and existing Service Worker `SKIP_WAITING` behavior.

- [ ] **Step 1: Write failing visibility and dismissal tests**

```ts
expect(shouldShowUpdate('/practice', false)).toBe(true)
expect(shouldShowUpdate('/welcome', false)).toBe(false)
expect(shouldShowUpdate('/session/abc', false)).toBe(false)
expect(shouldShowUpdate('/practice', true)).toBe(false)
```

Render a waiting worker, click “稍后”, remount with the same worker key, and assert the Snackbar remains absent for the current browser session.

- [ ] **Step 2: Run and observe the missing-policy failure**

Run: `pnpm vitest run src/components/install-prompt/service-worker-registration.test.tsx`

Expected: FAIL because the visibility policy and per-version dismissal do not exist.

- [ ] **Step 3: Implement safe-route visibility and session dismissal**

Suppress the prompt on `/`, `/welcome`, every `/session/` route, and while `document.documentElement.dataset.interactionBusy === 'true'`. On “稍后”, write the waiting-worker key to session storage before clearing local state.

- [ ] **Step 4: Move the component below content instead of over titles**

Define fixed-layer tokens:

```css
--page-header-height: 64px;
--speech-dock-height: 214px;
--z-sticky: 10;
--z-navigation: 20;
--z-notice: 30;
--z-dialog: 40;
```

Place the Snackbar at:

```css
bottom: calc(var(--nav-height) + env(safe-area-inset-bottom) + 12px);
z-index: var(--z-notice);
```

Use a compact two-row layout below 390px. Buttons remain at least 44px high. Add a visually hidden live status for update failures rather than reloading.

- [ ] **Step 5: Run component and existing PWA tests**

Run:

```powershell
pnpm vitest run src/components/install-prompt/service-worker-registration.test.tsx src/components/install-prompt/install-prompt.test.tsx src/app/manifest.test.ts
pnpm playwright test tests/e2e/pwa.spec.ts --project=chromium-mobile
```

Expected: PASS; existing Service Worker update behavior remains functional.

- [ ] **Step 6: Commit the update Snackbar**

```powershell
git add src/components/install-prompt/service-worker-registration* src/styles/tokens.css src/app/globals.css
git commit -m "fix: keep PWA updates clear of mobile content"
```

---

### Task 5: Complete Secondary Pages and Installation Help

**Files:**
- Modify: `src/components/install-prompt/install-prompt.tsx`
- Modify: `src/components/install-prompt/install-prompt.test.tsx`
- Modify: `src/components/install-prompt/install-prompt.module.css`
- Modify: `src/app/install/page.tsx`
- Modify: `src/app/privacy/page.tsx`
- Modify: `src/app/privacy/privacy.module.css`
- Modify: `src/app/auth/page.tsx`
- Modify: `src/features/profile/learning-center.tsx`

**Interfaces:**
- Produces: `InstallPlatform = 'ios' | 'android' | 'wechat' | 'unknown'`.
- Produces: `<InstallPrompt platform="auto" standalone? mode="page" | "prompt">`.
- Consumes: `MobilePageHeader`, `beforeinstallprompt`, `display-mode: standalone`, and existing install-dismissal keys for prompt mode only.

- [ ] **Step 1: Write failing unknown-platform and platform-switch tests**

```ts
render(<InstallPrompt platform="unknown" standalone={false} mode="page" />)
expect(screen.getByRole('tab', { name: 'iPhone' })).toBeVisible()
expect(screen.getByRole('tab', { name: 'Android' })).toBeVisible()
expect(screen.getByText('打开 Safari 的分享菜单')).toBeVisible()

fireEvent.click(screen.getByRole('tab', { name: 'Android' }))
expect(screen.getByText(/安装应用或添加到主屏幕/)).toBeVisible()
```

Add standalone coverage that shows “已安装到主屏幕” rather than returning `null` in page mode.

- [ ] **Step 2: Run and observe current unknown-platform blank behavior**

Run: `pnpm vitest run src/components/install-prompt/install-prompt.test.tsx`

Expected: FAIL because `unknown` page mode and platform tabs are absent.

- [ ] **Step 3: Implement a persistent page guide and optional prompt mode**

Page mode must always render. Unknown platform defaults to iPhone because the primary target is iPhone but leaves both tabs visible. WeChat mode shows “请使用 Safari 或系统浏览器打开” and still displays the two manual guides. Prompt mode may retain historical suppression and close controls.

Use WAI-ARIA tab semantics: `role="tablist"`, selected `role="tab"` with `aria-selected`, and linked `role="tabpanel"`.

- [ ] **Step 4: Apply the shared secondary header**

Use:

```tsx
<MobilePageHeader title="安装到手机" eyebrow="像 APP 一样使用" fallbackHref="/me" />
<MobilePageHeader title="隐私与数据" eyebrow="PRIVACY FIRST" fallbackHref="/me" />
<MobilePageHeader title="同步学习记录" eyebrow="OPTIONAL SYNC" fallbackHref="/me" />
```

Remove duplicated local back-header CSS after visual parity is confirmed. Ensure Learning Center links remain ordinary links so browser history is available.

- [ ] **Step 5: Run install, auth, data-control, and axe tests**

Run:

```powershell
pnpm vitest run src/components/install-prompt/install-prompt.test.tsx src/features/auth/auth-panel.test.tsx src/features/profile/data-controls.test.tsx src/components/app-shell/app-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit secondary-page consistency**

```powershell
git add src/components/install-prompt src/app/install src/app/privacy src/app/auth src/features/profile/learning-center.tsx
git commit -m "feat: complete mobile secondary pages"
```

---

### Task 6: Consistent Onboarding Back and Selection Semantics

**Files:**
- Modify: `src/features/onboarding/onboarding-flow.tsx`
- Modify: `src/features/onboarding/onboarding-flow.module.css`
- Modify: `src/features/onboarding/onboarding-flow.test.tsx`
- Modify: `src/app/welcome/page.tsx`

**Interfaces:**
- `OnboardingFlow` gains `returnHref?: string` and `initialChoices?: OnboardingChoices`.
- First-run mode omits an app-level back target; settings mode uses `returnHref="/me"`.
- Step-level back remains inside the flow and never navigates away.

- [ ] **Step 1: Write failing step-back and selected-state tests**

```ts
fireEvent.click(screen.getByRole('button', { name: 'B1 中级' }))
expect(screen.getByRole('button', { name: '返回选择英语水平' })).toBeVisible()
expect(screen.getByRole('button', { name: '旅行' })).toHaveAttribute('aria-pressed', 'true')
fireEvent.click(screen.getByRole('button', { name: '返回选择英语水平' }))
expect(screen.getByRole('heading', { name: '选择英语水平' })).toBeVisible()
```

Render with `returnHref="/me"` and assert an app-level “返回我的练习” link exists only on step 1.

- [ ] **Step 2: Run and observe the semantic/back-control failures**

Run: `pnpm vitest run src/features/onboarding/onboarding-flow.test.tsx`

Expected: FAIL on the new back label and `aria-pressed` assertions.

- [ ] **Step 3: Implement one top action row**

Replace the bottom underlined back buttons with a 44px top-left button inside each panel. Keep the progress label in the same row. Add `aria-pressed` to level, goal, and time choices. Do not auto-advance when a user taps the already selected option more than once.

- [ ] **Step 4: Detect settings entry without changing first-run routing**

The Welcome page must load the guest profile; if it already exists with completed onboarding data, pass `returnHref="/me"` and prefill choices. After completion, preserve the existing redirect to `/practice`.

- [ ] **Step 5: Run onboarding unit and first-session E2E tests**

Run:

```powershell
pnpm vitest run src/features/onboarding/onboarding-flow.test.tsx src/app/page.test.tsx
pnpm playwright test tests/e2e/first-session.spec.ts --project=chromium-mobile
```

Expected: PASS.

- [ ] **Step 6: Commit onboarding consistency**

```powershell
git add src/features/onboarding src/app/welcome/page.tsx
git commit -m "feat: standardize onboarding navigation"
```

---

### Task 7: Keyboard-Safe Practice Controls and Guarded Exit

**Files:**
- Create: `src/features/practice/exit-guard.tsx`
- Create: `src/features/practice/exit-guard.test.tsx`
- Create: `src/features/practice/text-review-dock.tsx`
- Create: `src/features/practice/text-review-dock.module.css`
- Create: `src/components/feedback-sheet/feedback-sheet.test.tsx`
- Modify: `src/features/practice/practice-stage.tsx`
- Modify: `src/features/practice/practice-stage.module.css`
- Modify: `src/features/practice/practice-stage.test.tsx`
- Modify: `src/components/feedback-sheet/feedback-sheet.tsx`
- Modify: `src/components/feedback-sheet/feedback-sheet.module.css`
- Modify: `src/components/speech-control/speech-control.module.css`
- Create: `tests/e2e/mobile-controls.spec.ts`

**Interfaces:**
- Produces: `exitGuardState(status: PracticeStatus, draftTranscript: string, hasAudio: boolean): 'clean' | 'draft' | 'recording' | 'processing'`.
- Produces: `<ExitGuard state fallbackHref onConfirmExit?>` with an accessible `alertdialog`.
- Produces: `<TextReviewDock transcript canSubmit errorMessage hasAudio onChange onCancel onSubmit>`.
- `FeedbackSheet` gains `contentId` and `onExpanded?(): void`; its toggle sets `aria-controls`.
- Consumes: existing practice-machine status, draft, audio, submit, cancel, and retry actions.

- [ ] **Step 1: Write failing pure exit-state and dialog tests**

```ts
expect(exitGuardState('recording', '', false)).toBe('recording')
expect(exitGuardState('reviewing', 'hello', false)).toBe('draft')
expect(exitGuardState('submitting', 'hello', false)).toBe('processing')
expect(exitGuardState('ready', '', false)).toBe('clean')
```

Render `ExitGuard` with `state="draft"`, request a back action, and assert an `alertdialog` named “退出本次练习？” exposes “继续练习” and “退出”.

- [ ] **Step 2: Run and observe missing exit-guard failures**

Run: `pnpm vitest run src/features/practice/exit-guard.test.tsx`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement guarded station and browser back behavior**

When guarded, register `beforeunload`. Add one sentinel history entry for the current session route; on `popstate`, reopen the current route and show the dialog. Confirmed exit uses `router.replace(fallbackHref)`; cancellation leaves the user on the current session. Remove listeners and sentinel state on unmount or when the state returns to clean.

Do not intercept back when `state === 'clean'`.

- [ ] **Step 4: Write a failing PracticeStage dock exclusivity test**

```ts
practiceState.value.machine = {
  status: 'reviewing', turnIndex: 0, draftTranscript: 'Hello',
}
render(<PracticeStage scene={scene} sessionId="session-text" />)
expect(screen.getByRole('region', { name: '确认你刚才说的话' })).toBeVisible()
expect(screen.queryByRole('button', { name: '开始录音' })).not.toBeInTheDocument()
expect(screen.getByRole('button', { name: '提交这一轮' })).toBeEnabled()
```

Also assert submitting/receiving renders no enabled recorder or duplicate submit control.

- [ ] **Step 5: Implement `TextReviewDock` and derive dock mode from machine state**

Move the entire review form from document content into the fixed dock. Use:

```tsx
const dockMode = isReviewing
  ? 'text'
  : ['submitting', 'receiving'].includes(status)
    ? 'processing'
    : 'speech'
```

Render exactly one dock. `TextReviewDock` uses `max-height: calc(100dvh - env(safe-area-inset-top) - 12px)`, `overflow-y: auto`, bottom safe-area padding, and `scroll-padding-bottom`. The textarea autofocuses once and the primary submit remains visible above a reduced mobile viewport.

- [ ] **Step 6: Keep feedback and completion actions visible**

Give feedback content `scroll-margin-bottom: calc(var(--speech-dock-height) + 24px)`. When expansion becomes true, schedule one `requestAnimationFrame` and call `detailsRef.current?.scrollIntoView({ block: 'nearest' })`. Apply the same bottom scroll margin to “完成场景并查看复盘”.

- [ ] **Step 7: Fix touch sizes and fixed-layer ownership**

Increase the topbar back target from 34px to 44px without moving the visible 23px icon. Set the root `data-interaction-busy` flag during recording, review, submitting, and receiving so the update Snackbar stays suppressed.

- [ ] **Step 8: Write E2E fixed-layer and keyboard-mode tests**

For 390 × 844 and 844 × 390:

```ts
await page.getByRole('button', { name: '改用键盘输入' }).click()
const textarea = page.getByLabel('英文内容')
const submit = page.getByRole('button', { name: '提交这一轮' })
await expect(textarea).toBeVisible()
await expect(submit).toBeVisible()
await expect(page.getByRole('button', { name: '开始录音' })).toBeHidden()
```

Use bounding boxes to assert the textarea and submit button intersect the viewport and are not covered by another fixed layer. Add draft-exit cancellation and confirmation paths.

- [ ] **Step 9: Run practice unit tests and mobile-control E2E in both engines**

Run:

```powershell
pnpm vitest run src/features/practice/exit-guard.test.tsx src/features/practice/practice-stage.test.tsx src/components/feedback-sheet/feedback-sheet.test.tsx src/components/speech-control/speech-control.test.tsx
pnpm playwright test tests/e2e/mobile-controls.spec.ts --project=chromium-mobile
pnpm playwright test tests/e2e/mobile-controls.spec.ts --project=webkit-iphone
```

Expected: PASS, allowing only documented browser-capability skips for unavailable microphone hardware.

- [ ] **Step 10: Commit practice interaction fixes**

```powershell
git add src/features/practice src/components/feedback-sheet src/components/speech-control tests/e2e/mobile-controls.spec.ts
git commit -m "fix: keep practice controls visible on mobile"
```

---

### Task 8: Completion and Report Navigation Consistency

**Files:**
- Modify: `src/features/practice/practice-stage.tsx`
- Modify: `src/features/practice/session-report.tsx`
- Modify: `src/features/practice/session-report.module.css`
- Modify: `src/features/practice/session-report.test.ts`
- Create: `src/features/practice/session-report-view.test.tsx`
- Modify: `src/features/profile/learning-center.tsx`
- Modify: `tests/e2e/first-session.spec.ts`

**Interfaces:**
- Completed PracticeStage renders a deterministic report link and no interactive practice controls.
- SessionReport consumes `MobilePageHeader` with `/me` fallback and retains two explicit terminal destinations.
- Completed Learning Center entries always link to `/session/[id]/report`.

- [ ] **Step 1: Write failing report navigation tests**

```ts
expect(screen.getByRole('link', { name: '返回我的练习' })).toHaveAttribute('href', '/me')
expect(screen.getByRole('navigation', { name: '复盘后操作' })).toBeVisible()
expect(screen.getByRole('link', { name: '回到今日练习' })).toHaveAttribute('href', '/practice')
expect(screen.getByRole('link', { name: /换个场景/ })).toHaveAttribute('href', '/scenes')
```

- [ ] **Step 2: Run and observe the missing shared-back failure**

Run: `pnpm vitest run src/features/practice/session-report.test.ts src/features/practice/session-report-view.test.tsx`

Expected: FAIL on the new back link.

- [ ] **Step 3: Add the shared report header and completed-state rules**

Keep the report’s current Atlantic score header, but place `MobilePageHeader` before it. The report header text is “本次复盘”, fallback is `/me`, and the back control label is “返回我的练习”. A completed session reached through browser Forward must continue to render the completion/report state, never a ready recorder.

- [ ] **Step 4: Extend first-session E2E to the report and terminal exits**

Complete the minimum deterministic local-coach turns, click “完成场景并查看复盘”, assert the intermediate completion state, open the report, then test both exit links in separate browser contexts.

- [ ] **Step 5: Run report and first-session tests**

Run:

```powershell
pnpm vitest run src/features/practice/session-report.test.ts src/features/practice/session-report-view.test.tsx src/features/practice/practice-stage.test.tsx
pnpm playwright test tests/e2e/first-session.spec.ts --project=chromium-mobile
```

Expected: PASS.

- [ ] **Step 6: Commit report navigation**

```powershell
git add src/features/practice/practice-stage.tsx src/features/practice/session-report.tsx src/features/practice/session-report.module.css src/features/practice/session-report.test.ts src/features/practice/session-report-view.test.tsx src/features/profile/learning-center.tsx tests/e2e/first-session.spec.ts
git commit -m "feat: standardize completion and report exits"
```

---

### Task 9: Cross-App Accessibility, Responsive, and Navigation Regression

**Files:**
- Create: `tests/e2e/navigation.spec.ts`
- Modify: `tests/e2e/responsive.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts`
- Modify: `src/app/globals.css`
- Modify: `src/styles/tokens.css`
- Modify: any component CSS proven by tests to violate the shared constraints

**Interfaces:**
- Consumes all UI contracts from Tasks 1–8.
- Produces no new public component API; this task closes cross-component gaps only.

- [ ] **Step 1: Write failing navigation and deep-link E2E coverage**

Cover these exact paths:

```text
/practice → /scenes → /me
/scenes?category=work&level=B2 → /scenes/daily-standup?... → back
/privacy direct deep link → /me fallback
/install direct deep link → /me fallback
/session/new?scene=hotel-check-in&level=B1 → guarded and clean exits
/session/[completed]/report → /practice and /scenes
```

Assert every route has one visible `h1`, no incorrect intermediate URL, and the expected active bottom destination when the bottom nav is present.

- [ ] **Step 2: Extend responsive tests to the complete viewport matrix**

Use:

```ts
const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 844, height: 390 },
  { width: 768, height: 1024 },
]
```

For `/practice`, `/scenes`, one scene detail, one session, `/me`, `/privacy`, `/install`, and one report, assert root horizontal overflow is at most 1px.

- [ ] **Step 3: Add a touch-target geometry audit**

Evaluate visible interactive elements and fail when either dimension is below 44px, excluding inline prose links that are not primary controls:

```ts
const undersized = await page.locator('button, nav a, [data-touch-target]').evaluateAll((nodes) =>
  nodes.filter((node) => {
    const rect = node.getBoundingClientRect()
    return rect.width < 44 || rect.height < 44
  }).map((node) => ({ text: node.getAttribute('aria-label') ?? node.textContent, rect: node.getBoundingClientRect().toJSON() })),
)
expect(undersized).toEqual([])
```

- [ ] **Step 4: Extend accessibility tests**

Assert:

- Tab focus never remains on `body` after the first Tab.
- Forward route changes focus `[data-page-title]`.
- Filters expose `aria-pressed`.
- Feedback toggle exposes `aria-expanded` and `aria-controls`.
- Exit confirmation has `role="alertdialog"`, an accessible name, and focus containment.
- 200% root font sizing does not create root horizontal overflow or hide primary actions.
- Forced dark preference still produces the explicit light theme.

- [ ] **Step 5: Run Chromium mobile regression and fix only proven gaps**

Run:

```powershell
pnpm playwright test tests/e2e/navigation.spec.ts tests/e2e/scene-filters.spec.ts tests/e2e/mobile-controls.spec.ts tests/e2e/responsive.spec.ts tests/e2e/accessibility.spec.ts --project=chromium-mobile
```

Expected: PASS. For each failure, use systematic debugging: reproduce one failure, identify the responsible component boundary, add or tighten the focused test, then patch the smallest scope.

- [ ] **Step 6: Run WebKit iPhone regression**

Run:

```powershell
pnpm playwright test tests/e2e/navigation.spec.ts tests/e2e/scene-filters.spec.ts tests/e2e/mobile-controls.spec.ts tests/e2e/responsive.spec.ts tests/e2e/accessibility.spec.ts --project=webkit-iphone
```

Expected: PASS, with only explicit environment-capability skips documented by the existing test policy.

- [ ] **Step 7: Commit cross-app regression coverage**

```powershell
git add tests/e2e/navigation.spec.ts tests/e2e/scene-filters.spec.ts tests/e2e/mobile-controls.spec.ts tests/e2e/responsive.spec.ts tests/e2e/accessibility.spec.ts src/app/globals.css src/styles/tokens.css
git commit -m "test: cover mobile UX consistency"
```

---

### Task 10: Full Verification, Visual QA, Version, and Vercel Release

**Files:**
- Modify: `package.json`
- Modify: `public/sw.js`
- Modify: `README.md`
- Modify: `APP_SPEC.md`
- Modify: `docs/DEPLOYMENT.md`
- Modify: `design-qa.md`
- Create: `tests/visual/mobile-ux-390x844.png`
- Create: `tests/visual/mobile-ux-844x390.png`

**Interfaces:**
- Consumes the finished Tasks 1–9.
- Produces version `2.2.0`, a matching Service Worker cache revision, updated QA evidence, and one verified Vercel production deployment.

- [ ] **Step 1: Run the complete local quality gate before changing version metadata**

Run:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Expected: all commands PASS; any capability skip has an existing explicit reason. Do not continue on failure.

- [ ] **Step 2: Start the verified production build and capture mobile design QA**

Run the built app on port 3100, then use the selected in-app browser at 390 × 844 and 844 × 390. Capture at minimum:

1. Scene library with a scrolled horizontal filter.
2. Scene preparation with shared back header and sticky CTA.
3. Dialogue Stage in speech mode.
4. Dialogue Stage in text-review mode.
5. Expanded feedback above the Dock.
6. Installation guide with iPhone and Android tabs.
7. Session report with header and terminal actions.

Compare the 390 × 844 Dialogue Stage result against `docs/design/speakmate-dialogue-stage-reference.png` at matching state and viewport. Reject screenshots with loading UI, cropping, wrong state, or fixed-layer overlap.

- [ ] **Step 3: Run design QA and document concrete evidence**

Update `design-qa.md` with pass/fail results for hierarchy, image crop, spacing, typography, touch targets, horizontal/vertical scrolling, fixed layers, focus visibility, safe areas, and reduced motion. Re-run affected tests after every visual fix.

- [ ] **Step 4: Bump app and Service Worker versions**

Change `package.json` from `2.1.1` to `2.2.0`. Change the named cache in `public/sw.js` to a matching unique `speakmate-v2.2.0-*` revision without changing cache policy.

- [ ] **Step 5: Update product and deployment documentation**

Record:

- the shared navigation contract;
- URL-backed scene filters;
- text-review Dock behavior;
- complete iPhone/Android install guide;
- exact unit/E2E counts;
- exact known capability skips;
- new production commit and deployment ID after deployment.

- [ ] **Step 6: Re-run the entire gate after version and documentation changes**

Run:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
git diff --check
```

Expected: PASS and a clean whitespace check.

- [ ] **Step 7: Commit the verified release candidate**

```powershell
git add package.json public/sw.js README.md APP_SPEC.md docs/DEPLOYMENT.md design-qa.md tests/visual
git commit -m "release: prepare SpeakMate 2.2.0"
```

- [ ] **Step 8: Deploy to Vercel production**

Use the Vercel deployment workflow already linked to `speakmate-pwa`. Deploy the exact verified commit to production without exposing secrets in terminal output. Record the returned deployment ID and canonical production URL.

- [ ] **Step 9: Verify the public deployment**

Run public checks against `https://speakmate-pwa.vercel.app`:

```text
GET /
GET /api/v1/health
GET /scenes?category=social&level=B1&duration=5
GET /install
```

Then complete a fresh guest smoke flow in the in-app browser and the WebKit Playwright project. Confirm the deployed HTML/manifest reports version 2.2.0 behavior and no old update banner obscures content.

- [ ] **Step 10: Record deployment evidence and commit it**

Update `docs/DEPLOYMENT.md` and `design-qa.md` with the deployment ID, UTC/CST timestamp, production URL, commit SHA, verification commands, and results.

```powershell
git add docs/DEPLOYMENT.md design-qa.md
git commit -m "docs: record SpeakMate 2.2.0 production release"
```

Expected final repository state: only intentionally retained audit artifacts may remain untracked; all source, tests, plans, and release documentation are committed.
