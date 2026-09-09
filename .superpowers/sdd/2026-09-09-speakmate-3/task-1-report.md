# Task 1 report: strict-local practice, speech, and settings

## Outcome

Implemented the strict-local practice path without changing navigation, the database schema, corpus content, or existing public call signatures. Confirmed text now goes directly to `localCoach` and persists locally; audio without confirmed text remains a memory-only preview and cannot submit. Stale cloud environment variables cannot activate conversation, ASR, auth, capabilities, or learner-data upload entry points.

## TDD evidence

### RED

1. `pnpm test src/features/practice/use-practice-session.test.tsx src/infrastructure/audio/browser-tts.test.ts src/infrastructure/audio/local-recognition.test.ts`
   - 3 files failed; 4 assertions failed and the new recognition module was missing.
   - Observed failures: confirmed text called `/api/v1/turns`; audio-only reached `recoverable-error`; remote English voice was selected; no-local-voice fell through to the browser default path.
2. Focused settings/UI/policy run across hook, stage, auth, sync, capability, and settings tests.
   - 6 files failed; 8 assertions failed plus the missing settings helper module.
   - Observed failures: autoplay ignored stored `false`; manual playback used the scene rate; feedback was collapsed; audio copy promised cloud ASR and submit remained enabled; auth/capability/sync activated from stale environment/configuration.
3. `pnpm test src/app/api/v1/turns/route.test.ts --reporter=verbose`
   - 1/11 failed: stale complete Cloudflare configuration made the audio route return the cloud-path 503 instead of local-only 422.
4. Provider/route release-gate RED run.
   - 7/20 failed: provider factory still contacted Cloudflare under stale valid environment values.
5. Recognition enforcement RED runs.
   - 2/6 initially failed for missing cancellation and missing instance-capability proof.
   - 1/7 then failed when a fake implementation ignored `processLocally = true` but was still started.
6. Final timing/voice loading RED run.
   - 2/12 failed: recording remained in permission state while `available()` was pending, and an initially remote-only voice list did not wait for `voiceschanged`.

Each failure was caused by the requested production behavior being absent; implementations followed after the corresponding failing run.

### GREEN

- First local practice/speech slice: 3 files, 11 tests passed.
- Persisted settings/UI/dormant adapters slice: 6 files, 26 tests passed.
- Late recognition and real practice/UI focused slice: 3 files, 28 tests passed.
- TTS voice loading: 1 file, 5 tests passed.
- Final hook/TTS regression run: 2 files, 12 tests passed.
- Full unit suite: `pnpm test --reporter=dot` exited 0; 44 files and 236 tests passed.
- Final typecheck: `pnpm typecheck` exited 0.
- `git diff --check` reported no whitespace errors (only Windows line-ending notices).

The test runner emitted the existing engine warning because this host uses Node 24.19.0 while `package.json` requests Node 22.x.

## Implementation and files

- `src/features/practice/use-practice-session.ts` and tests
  - Direct `localCoach.nextTurn` invocation; no turn API client in the client practice path.
  - Empty confirmed transcript is a no-op even when an audio preview exists.
  - Loads persisted settings before `ready`; defaults safely when absent or when memory fallback is required.
  - Applies `autoPlayAi`, `speechRate`, and exposes `feedbackExpanded`.
  - Exposes readable `speechError` without changing the practice machine or blocking typed input.
  - Uses an abort controller so pending local-capability checks cannot start or update transcripts after stop, interruption, or unmount.
- `src/infrastructure/audio/local-recognition.ts` and tests
  - Requires static `available({ langs: ['en-US'], processLocally: true }) === 'available'`.
  - Requires an instance-level `processLocally` property and verifies it remains `true` after assignment.
  - Never calls language installation; returns `null` for downloadable, downloading, unavailable, exceptions, unsupported constructors, or cancellation.
  - Aborts on cancellation and suppresses late transcript callbacks.
- `src/infrastructure/audio/browser-tts.ts` and tests
  - Selects only English voices with `localService === true`.
  - Waits briefly for `voiceschanged` when no local English voice is initially present.
  - Never calls `speechSynthesis.speak` without a local English voice.
- `src/infrastructure/persistence/learner-settings.ts` and tests
  - Adds a focused read helper over the existing `settings` object store; no schema change.
  - Defaults: rate `1`, autoplay `true`, feedback expanded `false`; persisted rate is normalized to `0.8 | 1 | 1.15`.
- `src/features/practice/practice-stage.tsx`, `text-review-dock.tsx`, and tests
  - Stored feedback expansion reaches the real `FeedbackSheet`.
  - Local-only copy replaces misleading AI/cloud/basic wording.
  - Audio is exposed only through a temporary object URL for local playback and revoked on cleanup; submission requires confirmed text.
  - Local speech errors are visible while keyboard practice remains enabled.
- `src/infrastructure/local-runtime-policy.ts`, `provider-factory.ts`, turn/capability route tests
  - Shared release gate makes all provider resolution local regardless of leftover environment variables.
  - The legacy `/api/v1/turns` entry remains compatible but cannot trigger cloud ASR/conversation; audio-only returns local `NO_SPEECH` and external fetch remains zero.
  - Capability output always reports cloud ASR, cloud conversation, and email sync disabled.
- `src/features/auth/auth-panel.tsx`, `src/app/auth/page.tsx`, and tests
  - Auth adapter props remain source-compatible but are dormant; the page no longer reads or passes cloud environment values.
- `src/infrastructure/persistence/sync.ts` and tests
  - `uploadLearnerData(client, userId, data)` retains its signature but fails closed with `REMOTE_LEARNING_DATA_DISABLED` before any client call.

## Changed interfaces

```ts
startLocalRecognition(options: {
  locale?: string
  onTranscript: (transcript: string) => void
  signal?: AbortSignal
}): Promise<LocalSpeechRecognition | null>

loadLearnerSettings(): Promise<LearnerSettings>

DEFAULT_LEARNER_SETTINGS: LearnerSettings
```

`usePracticeSession(scene, requestedId)` retains its arguments and all existing returned fields/actions, adding `feedbackExpanded: boolean` and `speechError: string | null`. `TextReviewDock` retains existing props and adds optional `audio?: Blob`. Future cloud adapter function signatures remain present but release-gated.

## Self-review and concerns

- Verified audio stays only in React/session memory and a revoked object URL; it is not added to persistence or any request.
- Verified there is no automatic speech-language package installation or default/remote TTS fallback.
- Verified stale Cloudflare and Supabase environment values do not activate runtime entry points.
- No browser E2E, physical iPhone, or installed-language-package device test was requested for this task. Web Speech on-device APIs are experimental and browser-specific, so unit tests cover the contract and failure-safe behavior, while real-device availability remains a later release-verification item.
- Host Node version differs from the declared Node 22.x engine; unit tests and typecheck nevertheless exited 0.
