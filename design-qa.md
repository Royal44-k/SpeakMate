# SpeakMate Design QA

- Date: 2026-09-03
- Scope: mobile PWA core speaking flow, with the hotel check-in scene at B1
- Target viewport: 390 × 844 CSS pixels, light color scheme
- Visual source: `docs/design/speakmate-dialogue-stage-reference.png`
- Render capture: `tests/visual/implementation-390x844.png`
- Combined comparison: `tests/visual/comparison-reference-vs-implementation.png`
- Capture recipe: `node scripts/capture-design-qa.mjs`

## Source and state alignment

The reference and implementation were normalized to the same 390 × 844 aspect ratio and placed side by side in one comparison image. The implementation fixture restores one completed learner turn from IndexedDB so both sides show the hotel check-in scene at step 2 / 6 with the same AI sentence. The reference is an art-direction target rather than a pixel-exact product screenshot; the implementation therefore keeps required working controls such as back navigation, TTS playback, task progress, privacy copy, and the text-input fallback.

No additional crop was needed: both full mobile frames remain at 1:1 CSS-pixel size in the 840-pixel-wide comparison, and the title, dialogue, hint, microphone, and keyboard control are all readable together.

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

## Automated evidence

- `pnpm verify`: lint, TypeScript, 58 unit/component tests, and production build passed.
- Playwright: Chromium-mobile and WebKit-iPhone flows passed for onboarding, first conversation turn, session recovery, microphone denial, PWA assets, offline privacy boundaries, and accessibility semantics.
- Responsive checks passed at 360 × 800, 390 × 844, 430 × 932, 768 × 1024, 844 × 390 landscape, 200% root text size, and forced dark preference.

## Open findings

None.

final result: passed
