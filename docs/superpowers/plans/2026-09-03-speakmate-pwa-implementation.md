# SpeakMate PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, test, visually verify, and deploy a zero-billing, mobile-first SpeakMate PWA that supports guest-first English scenario practice, optional free cloud AI, and iPhone home-screen installation.

**Architecture:** A single Next.js App Router application contains the PWA UI and same-origin Route Handlers. Pure TypeScript domain modules own scene adaptation, session state, feedback, and recommendation logic; browser and cloud capabilities are isolated behind provider interfaces so the app remains fully usable in local fallback mode. IndexedDB is authoritative for guest data, while Supabase Free sync and Cloudflare Workers AI Free are optional runtime adapters.

**Tech Stack:** Next.js 16.x, React 19.x, TypeScript strict, CSS Modules, Zustand, idb, Zod, Phosphor Icons, optional Supabase JS, Cloudflare Workers AI REST API, Vitest, Testing Library, jest-axe, Playwright, Vercel Hobby.

**Spec:** [`APP_SPEC.md`](../../../APP_SPEC.md)

## Global Constraints

- Target surface is a mobile-first installable PWA, not a WeChat mini program or native iOS application.
- Default deployment must work with no secrets and must not generate charges.
- `AI_MODE=auto` may use only Cloudflare Workers AI Free-plan allowlisted models; quota or provider failure must fall back locally.
- Original audio is never persisted, cached, logged, or uploaded to Supabase.
- Guest use must never be blocked by login.
- The scene catalog must contain at least 42 published scenes across seven categories and adapt content for A1, A2, B1, B2, and C1.
- A recording is at most 30 seconds and 2 MB; text entry is always available.
- No acoustic pronunciation score is shown.
- Visual implementation follows `docs/design/speakmate-dialogue-stage-reference.png` at a 390 × 844 CSS viewport.
- WCAG 2.2 AA, keyboard use, reduced motion, safe areas, and 44 × 44 px targets are release requirements.
- The production build must succeed when Cloudflare and Supabase environment variables are absent.
- Vercel deployment stays on Hobby; no paid trial, paid add-on, spend expansion, or purchased domain is enabled.

---

## Planned File Structure

```text
SpeakMate/
  src/
    app/
      api/v1/capabilities/route.ts
      api/v1/health/route.ts
      api/v1/turns/route.ts
      auth/page.tsx
      install/page.tsx
      me/page.tsx
      practice/page.tsx
      privacy/page.tsx
      scenes/[slug]/page.tsx
      scenes/page.tsx
      session/[id]/page.tsx
      session/[id]/report/page.tsx
      globals.css
      layout.tsx
      manifest.ts
      page.tsx
    components/
      app-shell/
      feedback-sheet/
      install-prompt/
      scene-image/
      speech-control/
    content/scenes/
      catalog.ts
      categories/*.ts
    domain/
      ai/contracts.ts
      ai/local-coach.ts
      learning/recommendation.ts
      practice/machine.ts
      practice/report.ts
      scenes/adapt-scene.ts
      scenes/types.ts
    features/
      auth/
      install/
      onboarding/
      practice/
      profile/
      scenes/
    infrastructure/
      ai/cloudflare-client.ts
      ai/provider-factory.ts
      audio/browser-recorder.ts
      audio/browser-tts.ts
      persistence/db.ts
      persistence/repositories.ts
      persistence/sync.ts
    styles/tokens.css
  public/
    icons/
    scenes/
    sw.js
  tests/
    e2e/
    fixtures/
  docs/design/
  APP_SPEC.md
  design-qa.md
  next.config.ts
  package.json
  playwright.config.ts
  tsconfig.json
  vercel.json
  vitest.config.ts
```

### Task 1: Reproducible Next.js and Verification Foundation

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `.prettierrc.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

**Interfaces:**
- Consumes: Node.js 22 and pnpm 11.
- Produces: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and aggregate `pnpm verify` commands.

- [x] **Step 1: Add configuration-only bootstrap files**

Create `package.json`, TypeScript, Vitest, ESLint, Prettier, Next.js, environment-example, and ignore configuration. Configuration is bootstrap infrastructure rather than product behavior; the first application behavior remains test-first.

```json
{
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "verify": "pnpm lint && pnpm typecheck && pnpm test && pnpm build"
  }
}
```

- [x] **Step 2: Install dependencies without enabling paid services**

Run: `pnpm install`  
Expected: lockfile is created and no install script requests cloud credentials.

- [x] **Step 3: Write the first page behavior test**

```tsx
// src/app/page.test.tsx
import { render, screen } from '@testing-library/react'
import HomePage from './page'

it('routes a new visitor toward the guest onboarding flow', () => {
  render(<HomePage />)
  expect(screen.getByRole('heading', { name: '随时开口，练真实英语' })).toBeVisible()
  expect(screen.getByRole('link', { name: '开始免费练习' })).toHaveAttribute(
    'href',
    '/welcome',
  )
})
```

- [x] **Step 4: Run the page test and confirm the red state**

Run: `pnpm test -- src/app/page.test.tsx`
Expected: FAIL because `src/app/page.tsx` does not exist.

- [x] **Step 5: Add the minimal root layout and welcome page**

Create a root layout that sets `lang="zh-CN"`, viewport safe-area support and SpeakMate metadata. Create the tested heading and onboarding link in `page.tsx`. Configure Next image formats AVIF/WebP and baseline security response headers.

- [x] **Step 6: Run the foundation checks**

Run: `pnpm test -- src/app/page.test.tsx && pnpm typecheck && pnpm build`
Expected: PASS; the production build contains `/` and no environment-variable error.

- [x] **Step 7: Commit the foundation**

```bash
git add package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json next-env.d.ts next.config.ts eslint.config.mjs .prettierrc.json .gitignore .env.example vitest.config.ts src
git commit -m "build: scaffold SpeakMate PWA foundation"
```

### Task 2: Domain Model, 42-Scene Catalog, and Level Adaptation

**Files:**
- Create: `src/domain/scenes/types.ts`
- Create: `src/domain/scenes/adapt-scene.ts`
- Create: `src/content/scenes/categories/travel.ts`
- Create: `src/content/scenes/categories/dining.ts`
- Create: `src/content/scenes/categories/daily.ts`
- Create: `src/content/scenes/categories/work.ts`
- Create: `src/content/scenes/categories/social.ts`
- Create: `src/content/scenes/categories/study.ts`
- Create: `src/content/scenes/categories/emergency.ts`
- Create: `src/content/scenes/catalog.ts`
- Test: `src/domain/scenes/adapt-scene.test.ts`
- Test: `src/content/scenes/catalog.test.ts`

**Interfaces:**
- Consumes: `CefrLevel`, `SceneDefinition`, and `LevelContent` from the approved spec.
- Produces: `SCENE_CATALOG`, `getSceneBySlug(slug)`, `getPublishedScenes()`, and `adaptScene(scene, level)`.

- [x] **Step 1: Write catalog and adaptation tests**

```ts
expect(SCENE_CATALOG).toHaveLength(42)
expect(new Set(SCENE_CATALOG.map((scene) => scene.category))).toHaveLength(7)
expect(SCENE_CATALOG.every((scene) => scene.status === 'published')).toBe(true)
expect(adaptScene(hotelCheckIn, 'A1').constraints.maxAiWords).toBe(9)
expect(adaptScene(hotelCheckIn, 'C1').constraints.strategy).toContain('implicit intent')
```

- [x] **Step 2: Run the focused tests**

Run: `pnpm test -- src/domain/scenes/adapt-scene.test.ts src/content/scenes/catalog.test.ts`  
Expected: FAIL because the catalog and adapter are absent.

- [x] **Step 3: Implement typed scene definitions and seven six-scene modules**

Each scene receives a stable ID, slug, version, bilingual title, task summary, learner and AI roles, estimated minutes, recommended turns, three measurable goals, per-level keywords/examples/opening lines, level constraints, image key, and published status. Health/emergency scenes include the non-advice safety note.

- [x] **Step 4: Implement level adaptation**

```ts
export function adaptScene(
  scene: SceneDefinition,
  level: CefrLevel,
): AdaptedScene {
  return {
    ...scene,
    level,
    keywords: scene.keywords[level],
    exampleExpressions: scene.exampleExpressions[level],
    openingLines: scene.openingLines[level],
    constraints: scene.constraints[level],
  }
}
```

- [x] **Step 5: Verify content invariants**

Run: `pnpm test -- src/domain/scenes/adapt-scene.test.ts src/content/scenes/catalog.test.ts`  
Expected: PASS with exactly 42 unique IDs and slugs, 7 categories, and complete A1–C1 mappings.

- [x] **Step 6: Commit the content model**

```bash
git add src/domain/scenes src/content/scenes
git commit -m "feat: add adaptive forty-two scene catalog"
```

### Task 3: Guest Profile, IndexedDB, and Session Recovery

**Files:**
- Create: `src/domain/learning/types.ts`
- Create: `src/domain/practice/types.ts`
- Create: `src/infrastructure/persistence/db.ts`
- Create: `src/infrastructure/persistence/repositories.ts`
- Create: `src/features/profile/profile-store.ts`
- Test: `src/infrastructure/persistence/repositories.test.ts`
- Test: `src/features/profile/profile-store.test.ts`

**Interfaces:**
- Consumes: scene IDs and versions from Task 2.
- Produces: `ProfileRepository`, `SessionRepository`, `TurnRepository`, `FavoriteRepository`, `ensureGuestProfile()`, `findRecoverableSession()`, `exportLearnerData()`, and `clearLearnerData()`.

- [ ] **Step 1: Write in-memory repository contract tests**

```ts
const profile = await repositories.profiles.ensureGuestProfile()
expect(profile.id).toMatch(/^guest_/)
await repositories.sessions.save(activeSession)
expect(await repositories.sessions.findRecoverable()).toEqual(activeSession)
await repositories.sessions.save({ ...activeSession, status: 'completed' })
expect(await repositories.sessions.findRecoverable()).toBeNull()
```

- [ ] **Step 2: Confirm the tests fail**

Run: `pnpm test -- src/infrastructure/persistence/repositories.test.ts`  
Expected: FAIL because repository interfaces and implementations do not exist.

- [ ] **Step 3: Implement versioned IndexedDB and memory test adapter**

Use database `speakmate-v1` with explicit version 1 stores: `profile`, `sessions`, `turns`, `favorites`, `settings`, `outbox`. Preserve ISO timestamps and UUID identifiers. Do not create an audio store.

- [ ] **Step 4: Implement guest identity and recovery behavior**

`ensureGuestProfile()` creates one durable device profile; `findRecoverableSession()` returns the most recently updated active session; export returns a schema-versioned JSON object; clear closes and deletes only `speakmate-v1`.

- [ ] **Step 5: Run persistence and type checks**

Run: `pnpm test -- src/infrastructure/persistence/repositories.test.ts src/features/profile/profile-store.test.ts && pnpm typecheck`  
Expected: PASS with fake IndexedDB in tests and no audio persistence API.

- [ ] **Step 6: Commit local-first persistence**

```bash
git add src/domain/learning src/domain/practice src/infrastructure/persistence src/features/profile
git commit -m "feat: add guest-first local persistence"
```

### Task 4: PWA Manifest, Offline Shell, Icons, and Install UX

**Files:**
- Create: `src/app/manifest.ts`
- Create: `src/components/install-prompt/install-prompt.tsx`
- Create: `src/components/install-prompt/install-prompt.module.css`
- Create: `src/components/install-prompt/service-worker-registration.tsx`
- Create: `src/app/install/page.tsx`
- Create: `public/sw.js`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Create: `public/icons/icon-maskable-512.png`
- Create: `public/apple-touch-icon.png`
- Test: `src/components/install-prompt/install-prompt.test.tsx`
- Test: `src/app/manifest.test.ts`

**Interfaces:**
- Consumes: root layout from Task 1.
- Produces: installable manifest, service-worker registration, offline shell behavior, `InstallPrompt`, and `/install` instructions.

- [ ] **Step 1: Write manifest and platform-branch tests**

```ts
expect(manifest().display).toBe('standalone')
expect(manifest().shortcuts?.map((item) => item.url)).toEqual([
  '/practice/today',
  '/scenes',
])
expect(screen.getByText('打开 Safari 的分享菜单')).toBeVisible()
```

- [ ] **Step 2: Confirm red state**

Run: `pnpm test -- src/app/manifest.test.ts src/components/install-prompt/install-prompt.test.tsx`  
Expected: FAIL because manifest and install components are absent.

- [ ] **Step 3: Generate original app icons and add the manifest**

Generate a simple Atlantic-blue SpeakMate icon with a coral five-bar speech waveform as a real raster asset, export all required sizes, and declare standalone portrait behavior, theme colors, scope, categories, and two shortcuts.

- [ ] **Step 4: Implement the service worker**

Use cache version `speakmate-shell-v1`; cache static shell and scene metadata; use network-first navigation, cache-first immutable assets, stale-while-revalidate scene content, and never intercept `/api/`, audio blobs, auth callbacks, or personal exports.

- [ ] **Step 5: Implement platform-specific installation guidance**

Chromium uses a captured `beforeinstallprompt` event; iOS displays Safari share-sheet instructions; already-standalone mode hides the prompt; dismissal persists for 14 days and auto-prompting stops after three impressions.

- [ ] **Step 6: Verify PWA assets and tests**

Run: `pnpm test -- src/app/manifest.test.ts src/components/install-prompt/install-prompt.test.tsx && pnpm build`  
Expected: PASS; build exposes `/manifest.webmanifest`, `/sw.js`, icons, and `/install`.

- [ ] **Step 7: Commit the installable shell**

```bash
git add src/app/manifest.ts src/app/install src/components/install-prompt public next.config.ts
git commit -m "feat: add installable offline PWA shell"
```

### Task 5: Design Tokens, Figma Structure, and Shared Mobile Shell

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/components/app-shell/app-shell.tsx`
- Create: `src/components/app-shell/app-shell.module.css`
- Create: `src/components/app-shell/bottom-navigation.tsx`
- Create: `src/components/scene-image/scene-image.tsx`
- Create: `src/components/scene-image/scene-image.module.css`
- Create: `docs/design/figma-handoff.md`
- Test: `src/components/app-shell/app-shell.test.tsx`

**Interfaces:**
- Consumes: selected visual reference and PWA layout.
- Produces: exact CSS design tokens, safe-area shell, three-item navigation, responsive scene imagery, and documented Figma node/token mapping.

- [ ] **Step 1: Write shell accessibility tests**

```ts
render(<AppShell activeDestination="practice">content</AppShell>)
expect(screen.getByRole('navigation', { name: '主要导航' })).toBeVisible()
expect(screen.getByRole('link', { name: '练习' })).toHaveAttribute(
  'aria-current',
  'page',
)
expect(await axe(document.body)).toHaveNoViolations()
```

- [ ] **Step 2: Confirm red state**

Run: `pnpm test -- src/components/app-shell/app-shell.test.tsx`  
Expected: FAIL because the shell is absent.

- [ ] **Step 3: Build the Figma-ready token and component map**

Map Atlantic, sky, coral, ink, spacing, radius, typography, app shell, navigation, stage banner, transcript, feedback sheet, and speech control to named Figma variables/components. If a writable Figma design file is available, create and validate the same tokens and the 390 × 844 practice frame with Auto Layout; otherwise preserve the exact node recipe in `figma-handoff.md` without claiming a Figma file was produced.

- [ ] **Step 4: Implement the shared shell**

Use `min-height: 100dvh`, safe-area padding, a centered maximum width of 480 px, three navigation destinations, visible focus rings, self-hosted display font, system Chinese body stack, and reduced-motion media queries.

- [ ] **Step 5: Add real scene assets**

Generate original hotel, airport, café, workplace, social, classroom, daily-service, and health-service editorial images. Convert them to responsive WebP/AVIF sources under 160 KB for the 390 px presentation size; never crop the full-screen visual reference into production assets.

- [ ] **Step 6: Verify shell and visual tokens**

Run: `pnpm test -- src/components/app-shell/app-shell.test.tsx && pnpm typecheck`  
Expected: PASS with no axe violations and all colors sourced from token variables.

- [ ] **Step 7: Commit the visual foundation**

```bash
git add src/styles src/components/app-shell src/components/scene-image public/scenes docs/design/figma-handoff.md
git commit -m "feat: establish Dialogue Stage design system"
```

### Task 6: Onboarding, Practice Home, and Scene Discovery

**Files:**
- Create: `src/features/onboarding/onboarding-flow.tsx`
- Create: `src/features/onboarding/onboarding-flow.module.css`
- Create: `src/features/scenes/scene-library.tsx`
- Create: `src/features/scenes/scene-card.tsx`
- Create: `src/features/scenes/scene-filters.tsx`
- Create: `src/features/scenes/scene-preparation.tsx`
- Create: `src/domain/learning/recommendation.ts`
- Create: `src/app/welcome/page.tsx`
- Create: `src/app/practice/page.tsx`
- Create: `src/app/scenes/page.tsx`
- Create: `src/app/scenes/[slug]/page.tsx`
- Test: `src/domain/learning/recommendation.test.ts`
- Test: `src/features/onboarding/onboarding-flow.test.tsx`
- Test: `src/features/scenes/scene-library.test.tsx`

**Interfaces:**
- Consumes: profile repositories, `SCENE_CATALOG`, `adaptScene`, and `AppShell`.
- Produces: `recommendScene(profile, history)`, onboarding completion, practice home, searchable/filterable scene library, and scene preparation route.

- [ ] **Step 1: Write recommendation and flow tests**

```ts
expect(recommendScene(travelB1Profile, [])?.category).toBe('travel')
expect(recommendScene(travelB1Profile, history)?.id).not.toBe(history[0].sceneId)
expect(screen.getByRole('heading', { name: '今天想练什么？' })).toBeVisible()
```

- [ ] **Step 2: Confirm red state**

Run: `pnpm test -- src/domain/learning/recommendation.test.ts src/features/onboarding/onboarding-flow.test.tsx src/features/scenes/scene-library.test.tsx`  
Expected: FAIL because recommendation and UI flows are absent.

- [ ] **Step 3: Implement the three-step onboarding**

Persist level, goals, and 5/10/15-minute preference. Include “帮我推荐” with five deterministic self-assessment questions. Never request an email during onboarding.

- [ ] **Step 4: Implement recommendation and practice home**

Prioritize goal match, level compatibility, incomplete session, not-practiced scenes, then least recently practiced. Show one dominant recommended scene and one continue action, not a metric dashboard.

- [ ] **Step 5: Implement scene discovery and preparation**

Provide category, CEFR, and duration filters plus title/keyword search. Scene preparation displays role, measurable goals, level-specific keywords, examples, and safety copy where required.

- [ ] **Step 6: Verify all discovery paths**

Run: `pnpm test -- src/domain/learning/recommendation.test.ts src/features/onboarding/onboarding-flow.test.tsx src/features/scenes/scene-library.test.tsx && pnpm typecheck`  
Expected: PASS; A1, B2, and C1 filters return adapted scenes.

- [ ] **Step 7: Commit discovery flows**

```bash
git add src/features/onboarding src/features/scenes src/domain/learning src/app/welcome src/app/practice src/app/scenes
git commit -m "feat: add onboarding and adaptive scene discovery"
```

### Task 7: Practice State Machine, Recording, TTS, and Local Coach

**Files:**
- Create: `src/domain/practice/machine.ts`
- Create: `src/domain/ai/contracts.ts`
- Create: `src/domain/ai/local-coach.ts`
- Create: `src/infrastructure/audio/browser-recorder.ts`
- Create: `src/infrastructure/audio/browser-tts.ts`
- Create: `src/components/speech-control/speech-control.tsx`
- Create: `src/components/speech-control/speech-control.module.css`
- Create: `src/components/feedback-sheet/feedback-sheet.tsx`
- Create: `src/features/practice/practice-stage.tsx`
- Create: `src/features/practice/use-practice-session.ts`
- Create: `src/app/session/[id]/page.tsx`
- Test: `src/domain/practice/machine.test.ts`
- Test: `src/domain/ai/local-coach.test.ts`
- Test: `src/components/speech-control/speech-control.test.tsx`

**Interfaces:**
- Consumes: adapted scenes, session repositories, visual shell, and `ConversationResult` contract.
- Produces: `transitionPractice(state, event)`, `createRecorder()`, `browserTts`, `localCoach.nextTurn()`, `SpeechControl`, and the active practice route.

- [ ] **Step 1: Write state, local-coach, and speech-control tests**

```ts
expect(transitionPractice(idle, { type: 'PRESS_RECORD' }).status).toBe(
  'requesting-permission',
)
expect(() => transitionPractice(recording, { type: 'START_SESSION' })).toThrow()
expect(localResult.feedback.issueTags).toHaveLength(0)
expect(localResult.provider).toBe('local')
```

- [ ] **Step 2: Confirm red state**

Run: `pnpm test -- src/domain/practice/machine.test.ts src/domain/ai/local-coach.test.ts src/components/speech-control/speech-control.test.tsx`  
Expected: FAIL because the practice engine is absent.

- [ ] **Step 3: Implement the pure state machine and deterministic coach**

Support every transition in the approved spec. The local coach matches goal keywords, detects a bounded set of level-appropriate grammar/clarity patterns, returns no more than two issue tags, and always produces a scenario-valid next reply.

- [ ] **Step 4: Implement browser recording safely**

Probe MIME support in order, request audio-only media, target 48 kbps, stop at 30 seconds, reject under 0.8 seconds or over 2 MB, expose amplitude samples, stop all tracks, and revoke all Blob URLs after use.

- [ ] **Step 5: Implement browser TTS**

Select an English device voice, support 0.8/1/1.15 rate, cancel before recording and on route exit, and surface playback failure without blocking text.

- [ ] **Step 6: Build the Dialogue Stage practice UI**

Match the selected visual hierarchy: Atlantic title band, 16:9 scene strip, large English AI line, Chinese situational hint, collapsed correction affordance, coral thumb-zone speech control, and keyboard alternative. Add click-to-toggle recording for accessibility and long-press behavior for touch users.

- [ ] **Step 7: Verify practice behavior**

Run: `pnpm test -- src/domain/practice/machine.test.ts src/domain/ai/local-coach.test.ts src/components/speech-control/speech-control.test.tsx && pnpm typecheck`  
Expected: PASS for permission denial, cancellation, silence, timeout, oversize, TTS cancellation, feedback limit, and illegal state transitions.

- [ ] **Step 8: Commit the offline-complete practice loop**

```bash
git add src/domain/practice src/domain/ai src/infrastructure/audio src/components/speech-control src/components/feedback-sheet src/features/practice src/app/session
git commit -m "feat: complete local speaking practice loop"
```

### Task 8: Safe Cloudflare AI Route and Automatic Fallback

**Files:**
- Create: `src/infrastructure/ai/cloudflare-client.ts`
- Create: `src/infrastructure/ai/provider-factory.ts`
- Create: `src/infrastructure/ai/prompt-builder.ts`
- Create: `src/app/api/v1/health/route.ts`
- Create: `src/app/api/v1/capabilities/route.ts`
- Create: `src/app/api/v1/turns/route.ts`
- Create: `src/features/practice/turn-api-client.ts`
- Test: `src/infrastructure/ai/provider-factory.test.ts`
- Test: `src/app/api/v1/turns/route.test.ts`

**Interfaces:**
- Consumes: `ConversationInput`, `ConversationResult`, local coach, session context, and audio Blob.
- Produces: `createConversationProvider(env)`, `transcribeWithCloudflare()`, `generateWithCloudflare()`, three `/api/v1` endpoints, and `submitTurn()`.

- [ ] **Step 1: Write cost-guard and route contract tests**

```ts
expect(createConversationProvider({ AI_MODE: 'auto' }).kind).toBe('local')
expect(() => assertAllowedModel('@cf/zai-org/glm-5.3')).toThrow(
  'Model is not allowed in zero-billing mode',
)
expect((await postTurn(overTwoMegabytes)).status).toBe(413)
expect((await postTurn(validTextOnly)).provider).toBe('local')
```

- [ ] **Step 2: Confirm red state**

Run: `pnpm test -- src/infrastructure/ai/provider-factory.test.ts src/app/api/v1/turns/route.test.ts`  
Expected: FAIL because providers and routes are absent.

- [ ] **Step 3: Implement strict environment parsing and model whitelist**

Allow only `@cf/openai/whisper`, `@cf/openai/whisper-large-v3-turbo`, and `@cf/zai-org/glm-4.7-flash`. Missing credentials select local mode. Never accept a model identifier from the browser.

- [ ] **Step 4: Implement Cloudflare ASR and LLM calls**

Send binary audio to the ASR endpoint and structured messages to the LLM endpoint. Abort ASR after 12 seconds and LLM after 15 seconds. Limit history to eight turns, transcript to 500 characters, completion to 420 tokens, and repair invalid structured output once.

- [ ] **Step 5: Implement Route Handlers and fallback semantics**

Validate multipart input with Zod, generate `requestId`, enforce 2 MB, support text-only requests, and return the common error structure. In `auto`, treat 429, capacity errors, timeouts, 5xx, and malformed output as local-fallback triggers.

- [ ] **Step 6: Connect the practice UI**

The UI displays `基础反馈模式` only when `degraded=true`; it does not expose vendor names. Retrying reuses the same idempotency key until success or a changed learner input.

- [ ] **Step 7: Verify cloud and local contracts**

Run: `pnpm test -- src/infrastructure/ai/provider-factory.test.ts src/app/api/v1/turns/route.test.ts && pnpm typecheck && pnpm build`  
Expected: PASS with mocked Cloudflare success, 429, timeout, invalid JSON, and missing-secret cases; build succeeds without secrets.

- [ ] **Step 8: Commit the optional real-AI path**

```bash
git add src/infrastructure/ai src/app/api src/features/practice .env.example
git commit -m "feat: add zero-billing cloud AI fallback"
```

### Task 9: Reports, History, Favorites, Privacy, and Optional Email Sync

**Files:**
- Create: `src/domain/practice/report.ts`
- Create: `src/features/practice/session-report.tsx`
- Create: `src/features/profile/learning-center.tsx`
- Create: `src/features/profile/data-controls.tsx`
- Create: `src/features/auth/auth-adapter.ts`
- Create: `src/features/auth/supabase-auth-adapter.ts`
- Create: `src/infrastructure/persistence/sync.ts`
- Create: `src/app/session/[id]/report/page.tsx`
- Create: `src/app/me/page.tsx`
- Create: `src/app/privacy/page.tsx`
- Create: `src/app/auth/page.tsx`
- Test: `src/domain/practice/report.test.ts`
- Test: `src/infrastructure/persistence/sync.test.ts`
- Test: `src/features/profile/data-controls.test.tsx`

**Interfaces:**
- Consumes: saved sessions/turns, favorites, profile, and optional public Supabase configuration.
- Produces: `buildSessionReport()`, learning history/statistics, JSON export, destructive-clear confirmation, `AuthAdapter`, and `mergeGuestData()`.

- [ ] **Step 1: Write report, merge, and data-control tests**

```ts
expect(report.metrics).toEqual(
  expect.objectContaining({ grammar: expect.any(Number), naturalness: expect.any(Number) }),
)
expect(report.metrics).not.toHaveProperty('pronunciation')
expect(mergeGuestData(local, remote).sessions).toHaveLength(2)
expect(screen.getByRole('button', { name: '永久清空本机数据' })).toBeVisible()
```

- [ ] **Step 2: Confirm red state**

Run: `pnpm test -- src/domain/practice/report.test.ts src/infrastructure/persistence/sync.test.ts src/features/profile/data-controls.test.tsx`  
Expected: FAIL because reporting and sync are absent.

- [ ] **Step 3: Implement explainable reports and learning center**

Calculate 0–4 grammar, vocabulary, naturalness, and interaction descriptors from stored feedback and goals. Show best expressions, at most two improvement themes, one next action, history, favorites, and simple weekly practice counts.

- [ ] **Step 4: Implement export and clear controls**

Export schema-versioned JSON locally. Require typed confirmation `清空` before deleting IndexedDB. Explain that clearing cannot be undone and does not delete a separately synced account unless selected.

- [ ] **Step 5: Implement optional Supabase auth and merge**

When both public variables exist, enable email OTP and RLS-backed sync; otherwise hide the form and show local-only status. Merge by UUID and `updatedAt`; upload local-only entities; never upload audio.

- [ ] **Step 6: Verify reporting and optional configuration**

Run: `pnpm test -- src/domain/practice/report.test.ts src/infrastructure/persistence/sync.test.ts src/features/profile/data-controls.test.tsx && pnpm build`  
Expected: PASS both with and without mocked Supabase variables.

- [ ] **Step 7: Commit learner records and sync**

```bash
git add src/domain/practice/report.ts src/features/practice/session-report.tsx src/features/profile src/features/auth src/infrastructure/persistence/sync.ts src/app/session src/app/me src/app/privacy src/app/auth
git commit -m "feat: add reports privacy controls and optional sync"
```

### Task 10: Browser E2E, Accessibility, Responsive, and Design QA

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/first-session.spec.ts`
- Create: `tests/e2e/recovery.spec.ts`
- Create: `tests/e2e/offline.spec.ts`
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `tests/e2e/responsive.spec.ts`
- Create: `tests/e2e/pwa.spec.ts`
- Create: `tests/visual/reference-and-implementation.png`
- Create: `design-qa.md`
- Modify: UI files identified by QA findings.

**Interfaces:**
- Consumes: complete local-mode product, selected source visual, and production build.
- Produces: automated user-flow evidence, browser screenshots, combined comparison evidence, and a passing `design-qa.md`.

- [ ] **Step 1: Write end-to-end tests before final polish**

```ts
test('guest completes a first session without cloud credentials', async ({ page }) => {
  await page.goto('/welcome')
  await page.getByRole('button', { name: 'B1 中级' }).click()
  await page.getByRole('button', { name: '旅行' }).click()
  await page.getByRole('button', { name: '每天 5 分钟' }).click()
  await page.getByRole('button', { name: '开始第一次练习' }).click()
  await page.getByRole('button', { name: '键盘输入' }).click()
  await page.getByLabel('输入你的英文回答').fill('I have a reservation under Li.')
  await page.getByRole('button', { name: '发送回答' }).click()
  await expect(page.getByText('看看怎么说更自然')).toBeVisible()
})
```

- [ ] **Step 2: Run E2E and record failures**

Run: `pnpm test:e2e`  
Expected: first run may expose missing selectors, responsive overflows, or state recovery defects; each failure is fixed in the owning module rather than bypassed in the test.

- [ ] **Step 3: Verify runtime and responsive behavior**

Test Chromium and WebKit projects at 360 × 800, 390 × 844, 393 × 852, 430 × 932, and 768 × 1024. Check onboarding, scene filtering, text and mocked microphone flows, feedback, completion, refresh recovery, offline shell, export, clear, install guidance, safe-area layout, keyboard focus, and reduced motion.

- [ ] **Step 4: Capture implementation evidence**

Run the production server, set the browser viewport to 390 × 844 with device scale factor 1, open the hotel check-in practice state matching the reference, and capture the content viewport. Record console errors and primary interactions.

- [ ] **Step 5: Create combined visual comparison and run Design QA**

Place the source visual and browser-rendered implementation in one comparison image. Evaluate typography, spacing/layout rhythm, colors/tokens, image fidelity, copy, accessibility, and polish. Save every P0/P1/P2 iteration and final evidence in `design-qa.md`.

- [ ] **Step 6: Fix every P0/P1/P2 and recapture**

Repeat the same-state 390 × 844 comparison until no actionable P0/P1/P2 remains. P3 suggestions may be recorded as follow-up polish.

- [ ] **Step 7: Run full local verification**

Run: `pnpm verify && pnpm test:e2e`  
Expected: all checks pass; `design-qa.md` ends with exactly `final result: passed`.

- [ ] **Step 8: Commit verified product**

```bash
git add playwright.config.ts tests design-qa.md src public
git commit -m "test: verify mobile PWA experience and design fidelity"
```

### Task 11: Vercel Hobby Deployment and Online Verification

**Files:**
- Create: `vercel.json`
- Create: `DEPLOYMENT.md`
- Modify: `README.md`
- Test: deployed `/api/v1/health`, Manifest, Service Worker, local fallback session, and HTTPS install path.

**Interfaces:**
- Consumes: verified production build and a user-authenticated Vercel Hobby account.
- Produces: one public `.vercel.app` deployment URL and a deployment guide that cannot enable billing accidentally.

- [ ] **Step 1: Add explicit zero-billing deployment configuration**

Configure Node.js runtime, security headers, service-worker no-cache headers, and a single nearby function region when supported by Hobby. Do not configure analytics, speed insights, cron, paid storage, marketplace integrations, or custom domains.

- [ ] **Step 2: Write deployment guard documentation**

`DEPLOYMENT.md` must require verifying the account says `Hobby`, declining Pro trials, leaving paid integrations disabled, setting no payment method, and deploying first with no environment variables. It must explain that Cloudflare/Supabase Free credentials are optional and entered only in Vercel Dashboard.

- [ ] **Step 3: Run the release build locally**

Run: `pnpm verify && pnpm test:e2e`  
Expected: PASS from a clean production build with no secrets.

- [ ] **Step 4: Inspect Vercel CLI authentication and deploy a preview**

Run: `vercel whoami`  
Expected: an authenticated personal Hobby account. Then run `vercel --yes` only after confirming the linked scope is not a paid team.

- [ ] **Step 5: Verify the preview deployment**

Check HTTPS, `/api/v1/health`, `/manifest.webmanifest`, `/sw.js`, app icons, first-session local fallback, refresh recovery, console errors, mobile viewport, and install page. A failed online check blocks production promotion.

- [ ] **Step 6: Promote the verified deployment without enabling paid resources**

Run: `vercel --prod --yes`  
Expected: a `.vercel.app` production URL on the same Hobby scope. Do not purchase or attach a domain.

- [ ] **Step 7: Re-run online smoke tests and record evidence**

Run Playwright against `PLAYWRIGHT_BASE_URL=<production-url>` for the first-session and PWA specs. Record the final URL, deployment timestamp, git SHA, Vercel plan, AI mode, and known China-network limitation in `DEPLOYMENT.md`.

- [ ] **Step 8: Commit deployment documentation**

```bash
git add vercel.json DEPLOYMENT.md README.md
git commit -m "docs: record zero-billing Vercel deployment"
```

## Plan Self-Review

- Every must-have section in `APP_SPEC.md` maps to at least one task.
- Real AI is optional at runtime but fully implemented and contract-tested; local mode preserves the full practice journey.
- The plan contains no requirement to buy a domain, enter a payment method, activate a paid trial, or exceed a free quota.
- PWA installation, iPhone behavior, visual fidelity, privacy, no-audio-retention, and A1–C1 content have explicit evidence gates.
- Native App Intents remain intentionally outside the PWA implementation; stable deep links and Manifest shortcuts preserve the future integration boundary.
- Deployment completion requires a real online URL and online smoke tests, not only a local build.
