# SpeakMate Design QA

- Last updated: 2026-09-08
- Scope: mobile PWA core speaking flow, with the hotel check-in scene at B1
- Current candidate: 2.2.0; mobile visual and interaction QA passed with physical-device validation retained as a release follow-up
- Target viewports: 390 × 844 portrait and 844 × 390 landscape CSS pixels, light color scheme
- Visual source: `docs/design/speakmate-dialogue-stage-reference.png`
- Current portrait capture: `tests/visual/mobile-ux-390x844.png` (390 × 844 pixels, device scale factor 1)
- Current landscape capture: `tests/visual/mobile-ux-844x390.png` (844 × 390 pixels, device scale factor 1)
- Normalized combined comparison: `tests/visual/comparison-reference-vs-implementation.png` (840 × 910 pixels)
- Capture recipe: `node scripts/capture-design-qa.mjs`

## Source and state alignment

The source file is 853 × 1844 pixels. The approved comparison normalizes the source and implementation to the same 390 × 844 frame and places them side by side without using either image as a substitute for interaction testing. The current fixture restores one completed learner turn from IndexedDB so the implementation shows the B1 hotel check-in scene at step 2 / 6. The reference is an art-direction target, not an exact content fixture: its opening copy differs intentionally, while the branded stage, hotel scenario, task progress, English line, contextual cue, coral microphone, and keyboard fallback remain the comparison anchors.

The fresh selected in-app-browser portrait capture calibrated to 390 × 845 physical screenshot pixels for the approximately 390 × 844 target because of one-pixel IAB rounding. The source and that fresh implementation were emitted together in one comparison input; the existing normalized comparison independently corroborates the same hierarchy. The approved Playwright artifact records the implementation at exact 390 × 844 pixels and 1× density. No loading state, unintended crop, root overflow, or fixed-layer collision is present.

The IAB landscape visual viewport measured approximately 844.6 × 415 CSS pixels and kept every dialogue control visible. Because the IAB screenshot backend caps or downsamples wide captures, the approved Playwright path supplies the exact 844 × 390, 1× landscape artifact. Focused-region comparison was unnecessary because the portrait comparison and exact artifacts keep the display typography, hotel artwork, dialogue hierarchy, icons, microphone control, privacy copy, and keyboard fallback directly readable.

## Static source review

- Uses the shared Atlantic/coral/sky design tokens, Barlow Condensed display type, and Phosphor icons; no emoji, improvised SVG, or placeholder UI is present.
- The scene image is a real generated WebP asset with descriptive alternative text and controlled focal point.
- Primary actions expose semantic button/link names, 44-pixel-or-larger touch targets, keyboard focus rings, safe-area padding, and reduced-motion handling.
- The microphone path includes click and press-and-hold interaction; denied or unsupported recording falls back to text input.
- Feedback is intentionally limited to the most communication-relevant issues; reports do not claim unsupported pronunciation or phoneme scores.
- Global `color-scheme: light` preserves the selected visual direction under a forced dark preference.

## Rendered-state review

### Pass 1

- The compact application header made the selected “Dialogue Stage” identity too weak against the reference.
- The primary microphone action read as a small utility control rather than the visual and interaction focus.
- The feedback sheet margin selector crossed CSS-module boundaries and could not reliably align with the dialogue column.

### Pass 2 fixes

- Restored the large condensed “Dialogue Stage” heading, scene context, progress label, taller Atlantic header, and 2:1 scene-image crop.
- Rebuilt the speech dock around a centered coral microphone, Phosphor waveform icons, explicit 30-second privacy copy, and a full-width keyboard fallback.
- Added an explicit feedback holder and aligned all dialogue, hint, error, processing, and feedback surfaces to the same content inset.

### Pass 3 final check

- Removed the remaining title truncation at 390 pixels while retaining the back action and progress counter.
- Reference and implementation now share the intended hierarchy: branded stage → cinematic scenario → AI line → concise cue → speaking action → keyboard fallback.
- No clipped content, broken spacing, unintended horizontal overflow, unreadable text, or inaccessible unlabeled core controls remain in the inspected state.

### Pass 4 release revalidation

- Re-captured the same B1 hotel check-in state after the PWA update lifecycle, audio-only submission, and storage-recovery changes.
- Typography remains consistent: Barlow Condensed carries the display hierarchy without truncation; compact Chinese guidance uses readable weight and line height.
- Spacing, Atlantic/coral/sky tokens, Phosphor icon treatment, generated scene-image crop, and all app-specific copy remain aligned with the approved visual direction.
- The update notification is anchored to the safe-area-aware top edge, so it does not cover the persistent microphone or keyboard actions.
- No new P0, P1, or P2 design mismatch was found in the combined comparison.

### Pass 5 version 2.1 revalidation

- Re-captured the same viewport and state after explicit per-goal completion signals, immutable scene snapshots, and expanded offline recovery were implemented.
- The release-hardening changes did not alter the approved hierarchy, image crop, typography, control placement, or visible mobile density.
- No new P0, P1, or P2 design mismatch was found.

### Pass 6 release-blocker revalidation

- Rechecked the approved reference/implementation comparison after session-switch isolation, the privacy-safe generic offline session shell, and the cloud quota release gate were added.
- These changes affect lifecycle, persistence, and server safeguards only; the inspected Dialogue Stage viewport and interaction hierarchy remain unchanged.
- The offline shell deliberately reuses the existing loading and session components rather than introducing a visually divergent recovery surface.
- No new P0, P1, or P2 design mismatch was found.

### Pass 7 mobile consistency acceptance for 2.2.0

The fresh selected in-app-browser walkthrough verified the following real routes and states, rather than isolated screenshots:

1. Scene Library with the category strip scrolled horizontally to about `190.77 / 191` pixels and no root-level overflow.
2. Scene preparation with the shared back header and unobscured sticky primary action.
3. Dialogue Stage at hotel B1, step 2 / 6, in Speech Dock mode.
4. Text Review Dock with both enabled and disabled actions, followed by the Processing Dock transition.
5. Expanded per-turn feedback positioned above the active Dock.
6. Installation help with iPhone and Android WAI-ARIA tabs and the platform-specific manual copy.
7. Session report with the shared header and both explicit terminal actions.

The IAB console contained 0 warnings and 0 errors during this walkthrough. The 390 × 845 rounded IAB portrait and source reference were judged together in one comparison input. The exact 390 × 844 and 844 × 390 Playwright artifacts were then inspected at original resolution. No actionable P0, P1, or P2 mismatch was found.

| Fidelity surface | 2.2.0 result and evidence |
| --- | --- |
| Hierarchy | Passed: Atlantic stage header, 2 / 6 progress, hotel scenario, English response, contextual cue, coral speaking action and keyboard fallback retain the approved reading order. |
| Image crop | Passed: the generated hotel check-in image keeps the people, counter and role context legible in portrait and the responsive landscape crop; it is not stretched or replaced. |
| Spacing and typography | Passed: Barlow Condensed display hierarchy, Chinese guidance, content insets, dividers, corner radii and action spacing remain consistent; no title truncation or unreadable label was observed. |
| Touch targets | Passed: automated geometry checks cover visible interactive controls at a minimum 44 × 44 pixels, with explicit inline-link exceptions and spacing checks for independent sibling controls. |
| Horizontal and vertical scrolling | Passed: the filter strip reaches its end without root overflow; history return restores the list within a two-sided tolerance; long content uses document scroll and provides its escape action. |
| Fixed layers | Passed: bottom navigation, scene sticky CTA, Speech Dock, Text Review Dock, Processing Dock and expanded feedback remain inside the safe viewport without mutual overlap at all six automated sizes. |
| Focus visibility | Passed: forward navigation focuses the page title, the first supported Tab reaches an interactive control, dialogs contain focus, and selected filters/tabs expose their semantic state. |
| Safe areas | Passed in CSS/automation: `viewport-fit=cover`, shared inset variables and bottom clearance are present and verified in simulated viewports; hardware-notch behavior remains a real-device follow-up. |
| Reduced motion | Passed: reduced-motion behavior disables nonessential smooth scrolling and animation while preserving state visibility and task completion. |

## 2.1.1 historical automated evidence

- `pnpm lint`, `pnpm typecheck`, 92 unit/component tests, and the production build passed.
- Playwright: 24 checks passed and 4 browser-capability-specific checks were skipped as intended across Chromium-mobile and WebKit-iPhone.
- Primary interactions verified: onboarding, first text-assisted turn, audio-only submission, session recovery, microphone denial, scene filtering, PWA assets, offline public-shell recovery, install guidance, and accessibility semantics.
- Browser console review found no application errors in the captured release state.
- Responsive checks passed at 360 × 800, 390 × 844, 430 × 932, 768 × 1024, 844 × 390 landscape, 200% root text size, and forced dark preference.

## 2.2.0 release-candidate automated evidence

- Both the pre-version and post-change gates ran `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and the complete two-engine Playwright suite. Each gate passed with 37 Vitest files / 179 tests and 83 Playwright passes / 5 capability skips / 0 failures across 88 cases.
- Navigation coverage verifies exactly three primary destinations, shared secondary-page headers, safe direct-deep-link fallbacks, guarded/clean session exits, report terminal actions, one visible `h1`, forward-title focus, and correct active bottom navigation where present.
- Scene coverage verifies URL-backed search/category/level/duration state, full-card detail links, selected filter semantics, horizontal strip containment, exact back URL recovery, and two-sided vertical scroll restoration tolerance.
- Practice coverage verifies that Speech, Text Review, and Processing Docks are mutually exclusive; text input and submit actions remain reachable at 390 × 844, 844 × 390, and a shrunken iPhone-keyboard approximation; feedback and completion controls stay above fixed layers.
- Responsive coverage spans 320 × 568, 360 × 800, 390 × 844, 430 × 932, 844 × 390, and 768 × 1024. It checks root overflow, 44-pixel touch geometry, spacing between independent targets, bottom navigation, scene sticky CTA, every practice Dock, safe viewport intersection, 200% text, explicit light theme, reduced-motion-sensitive behavior, and serious/critical Axe findings.
- Installation coverage verifies the persistent iPhone/Android tab interface, WAI-ARIA tab keyboard behavior, standalone state, unknown-platform fallback, and the WebKit iPhone “添加到主屏幕” copy.
- The five skips are explicit capability partitions: Chromium omits the iPhone-only install-copy case; Playwright WebKit cannot expose Safari Full Keyboard Access for sequential link focus; the audio-only MediaRecorder mock targets Chromium; two Service Worker offline-cache cases target Chromium production behavior.
- The first Windows `pnpm test:e2e` emitted all 88 pass/skip results but its Playwright-owned Next.js server did not terminate. Re-running against a separately started production server via `PLAYWRIGHT_BASE_URL` exited 0 with the same 83/5 result. This is recorded as a Windows test-server teardown limitation, not a test failure.

## Deployment and reachability evidence

- Verified deployed source commit: `dcaf18701891a77f59b2d58042823f173e2b7b0f`.
- Preview deployment `dpl_WkQVPYnKDT9MDQhgvxPFCrz27jYD` at <https://speakmate-55q5fdjt9-lirongouyang522-3492s-projects.vercel.app> was inspected as Preview / Ready, created 2026-09-08 13:17:54 CST.
- The preview was promoted to Production deployment `dpl_635uQRg99PiT8eUBqU9X5sJoYAt8` at <https://speakmate-otr5hnill-lirongouyang522-3492s-projects.vercel.app>, inspected as Production / Ready, created 2026-09-08 13:25:12 CST (05:25:12 UTC).
- Canonical aliases include <https://speakmate-pwa.vercel.app>. A second alias inspection confirmed in the Vercel control plane that this canonical domain resolves to the same Production deployment.
- Rollback remains available through the previously verified deployment `dpl_FwV45ugpo992BTjuktFUUq6ZTsG8`.

The Vercel control-plane checks passed, but this China-mainland workstation could not complete public-content verification: system DNS returned the poisoned address `157.240.12.50`; Google DoH returned Vercel A records `216.198.79.131` and `64.29.17.131`; direct `vercel curl` timed out; `curl --resolve` to either official A record was reset during TLS; and in-app-browser navigation timed out. Therefore public GETs, the deployed guest flow, remote WebKit smoke, China-mainland reachability, and iPhone hardware validation are **not passed or claimed** here. This network limitation does not alter the independently completed local visual comparison and interaction QA.

## Release follow-ups, not design-QA blockers

- There are no open P0, P1, or P2 visual findings in the inspected 2.2.0 states.
- Public-release verification from a network that can reach the canonical deployment still must complete the homepage, health, filtered-scenes and install GETs, the guest smoke flow, and a remote WebKit check.
- Physical iPhone and Android testing remains necessary for hardware safe areas, Safari dynamic toolbar, real software keyboard, Full Keyboard Access, hardware microphone permission and recording interruption, standalone installation, and China-mainland Wi-Fi/cellular reachability. Automated viewports and screenshots cannot establish those device facts.

final result: passed
