# SpeakMate Design QA

- Date: 2026-09-05
- Scope: mobile PWA core speaking flow, with the hotel check-in scene at B1
- Target viewport: 390 × 844 CSS pixels, light color scheme
- Visual source: `docs/design/speakmate-dialogue-stage-reference.png`
- Render capture: `tests/visual/implementation-390x844.png`
- Combined comparison: `tests/visual/comparison-reference-vs-implementation.png`
- Capture recipe: `node scripts/capture-design-qa.mjs`

## Source and state alignment

The reference and implementation were normalized to the same 390 × 844 aspect ratio and placed side by side in one comparison image. The implementation fixture restores one completed learner turn from IndexedDB so both sides show the hotel check-in scene at step 2 / 6 with the same AI sentence. The reference is an art-direction target rather than a pixel-exact product screenshot; the implementation therefore keeps required working controls such as back navigation, TTS playback, task progress, privacy copy, and the text-input fallback.

No additional crop was needed: both full mobile frames remain at 1:1 CSS-pixel size in the 840-pixel-wide comparison, and the title, dialogue, hint, microphone, and keyboard control are all readable together.

Focused-region comparison was not needed because the 390 × 844, 1× combined source shows the display typography, generated hotel artwork, dialogue copy, icons, microphone control, privacy copy, and keyboard fallback at directly readable size.

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

## Automated evidence

- `pnpm lint`, `pnpm typecheck`, 87 unit/component tests, and the production build passed.
- Playwright: 24 checks passed and 4 browser-capability-specific checks were skipped as intended across Chromium-mobile and WebKit-iPhone.
- Primary interactions verified: onboarding, first text-assisted turn, audio-only submission, session recovery, microphone denial, scene filtering, PWA assets, offline public-shell recovery, install guidance, and accessibility semantics.
- Browser console review found no application errors in the captured release state.
- Responsive checks passed at 360 × 800, 390 × 844, 430 × 932, 768 × 1024, 844 × 390 landscape, 200% root text size, and forced dark preference.

## Open findings

None.

final result: passed
