# Task 3I implementation report — DONE_WITH_CONCERNS

Task-owned implementation and self-review are complete. Final full unit suite, typecheck, changed-file lint, production build and direct HTTP artifact checks passed. Independent review and real browser acceptance remain pending with the controller; this is not a release or browser-offline acceptance claim. Parent/controller documentation commits are preserved. Earlier milestones below remain chronological, including genuine failures and superseded interim artifacts.

## Commit scope and changed files

Original integration BASE: `4bb343404306298ebfa8c520832b78491504de0b`. Preimplementation-commit HEAD: controller documentation `338c47b3d3ae68373e1032f67da4cd779ec5f11f`. The following 93 implementation/test/review-ledger files are task-owned. Parent contracts/briefs/ordered decisions are not staged with these changes. No lockfile/dependency list changes; package.json changes only the existing build command to generate its public manifest. Generated offline-build.js, runtime binaries and .next remain ignored.

```text
.gitignore
package.json
public/sw.js
src/app/scenes/[slug]/page.test.tsx
src/app/scenes/[slug]/page.tsx
src/app/session/[id]/page.tsx
src/app/session/[id]/report/page.tsx
src/components/app-shell/app-shell.test.tsx
src/components/app-shell/navigation-history.test.ts
src/components/app-shell/navigation-history.ts
src/components/app-shell/route-coordinator.tsx
src/components/app-shell/smart-back-link.tsx
src/components/feedback-sheet/feedback-sheet.tsx
src/components/install-prompt/service-worker-registration.test.tsx
src/components/install-prompt/service-worker-registration.tsx
src/components/scene-image/scene-image.tsx
src/content/analysis/provider.ts
src/content/dialogues/graded/coffee-order/c1.ts
src/content/dialogues/graded/coffee-order/coffee-pilot-review.md
src/content/dialogues/graded/daily/daily-review.md
src/content/dialogues/graded/daily/haircut-request.ts
src/content/dialogues/graded/dining/dining-review.md
src/content/dialogues/graded/dining/restaurant-order.ts
src/content/dialogues/graded/dining/return-item.ts
src/content/dialogues/graded/dining/supermarket-help.ts
src/content/dialogues/graded/social-corpus.test.ts
src/domain/learning/recommendation.ts
src/domain/practice/types.ts
src/domain/scenes/search-scenes.ts
src/features/practice/exit-guard.test.tsx
src/features/practice/exit-guard.tsx
src/features/practice/offline-session-shell.tsx
src/features/practice/practice-home.test.tsx
src/features/practice/practice-home.tsx
src/features/practice/practice-stage.module.css
src/features/practice/practice-stage.test.tsx
src/features/practice/practice-stage.tsx
src/features/practice/session-report-view.test.tsx
src/features/practice/session-report.module.css
src/features/practice/session-report.tsx
src/features/practice/session-resolver.test.tsx
src/features/practice/session-resolver.tsx
src/features/practice/use-practice-session.test.tsx
src/features/practice/use-practice-session.ts
src/features/profile/learning-center.test.tsx
src/features/profile/learning-center.tsx
src/features/scenes/scene-card.tsx
src/features/scenes/scene-filter-state.test.ts
src/features/scenes/scene-filter-state.ts
src/features/scenes/scene-library-route.tsx
src/features/scenes/scene-library.test.tsx
src/features/scenes/scene-library.tsx
src/features/scenes/scene-preparation.module.css
src/features/scenes/scene-preparation.tsx
src/infrastructure/persistence/backup-schemas.ts
src/infrastructure/persistence/graded-backup.test.ts
src/infrastructure/persistence/learning-repository.ts
src/infrastructure/persistence/repositories.ts
scripts/offline-manifest.d.mts
scripts/offline-manifest.mjs
src/app/content/v1/[category]/route.ts
src/app/scenes/prepare/page.tsx
src/app/session/page.tsx
src/app/session/report/page.tsx
src/components/app-shell/learning-routes.test.ts
src/components/app-shell/learning-routes.ts
src/components/app-shell/offline-readiness.test.tsx
src/components/app-shell/offline-readiness.ts
src/components/app-shell/route-coordinator.test.tsx
src/components/scene-image/scene-image.test.tsx
src/content/analysis/match-authored-analysis.ts
src/content/dialogues/graded/integration-paths.test.ts
src/content/dialogues/graded/integration-polish.test.ts
src/content/public-category-production.test.ts
src/content/public-category-schema.ts
src/content/public-category.test.ts
src/content/public-category.ts
src/content/scenes/metadata.test.ts
src/content/scenes/metadata.ts
src/content/scenes/practice-presentation.ts
src/content/verified-category-response.ts
src/domain/practice/graded-evidence.ts
src/domain/practice/graded-presenter.test.ts
src/domain/practice/graded-presenter.ts
src/domain/practice/prepared-practice.ts
src/features/practice/historical-practice-record.tsx
src/features/practice/legacy-learning-shell.tsx
src/features/practice/static-learning-shell.tsx
src/features/scenes/scene-preparation.test.tsx
src/infrastructure/persistence/offline-manifest.test.ts
src/infrastructure/persistence/offline-worker.test.ts
src/infrastructure/persistence/practice-repository.test.ts
src/infrastructure/persistence/practice-repository.ts
```

Implementation commit: `15f65eee6c7d0ea6ce7d37f4b2c29df99e49dfc2` (`feat: integrate reviewed graded practice and verified offline content`), parent exactly `338c47b3d3ae68373e1032f67da4cd779ec5f11f`. Explicit staged-file inventory matched the above93paths, `git diff --cached --check` exit0; commit93files/8084insertions/1947deletions. No controller doc or unrelated file included.

Postimplementation-commit checks at2026-09-11 11:02:55: `git status --porcelain=v1 --untracked-files=all` empty; `git diff --check` exit0; portable runtime `--version` = `v22.23.2`; no3113listener. Task evidence files are this report and `task-3i-production-check.mjs` beside it, packaged in a separate documentation-only commit. Only these two ignored paths are explicitly force-added; ignored runtime/generated directories are not included. This separates reproducible evidence from the exact tested source commit. Final evidence-commit SHA is supplied in the handoff.

## Runtime

All commands use `.superpowers/sdd/2026-09-09-speakmate-3/runtimes/node-v22.23.2-win-x64/node.exe` from this worktree. No dependencies/services/browser/subagents/deployment used.

## TDD / focused evidence (2026-09-10 local)

Chronological command aliases below all use the exact portable runtime in Runtime and `node_modules/vitest/vitest.mjs run`. Early milestones retained summaries rather than every exact historical argument list; those omissions are not reconstructed as observed commands or retroactively rerun. Their named tests are in the changed-file inventory; later exact path lists and final full-suite command are recorded verbatim. Clock times are local Asia/Shanghai.

- 20:46:21 navigation A→B + scene q serialization RED: 2 failed /6 passed,7.33s.
- 20:47:36 typed learning-route helper stub RED:11 failed,6.08s.
- 20:51:08 foundation helpers GREEN:3files19passed,7.99s.
- 20:59:23 existing scene/exit consumers:5failed41total,42.32s (four obsolete router/q assertions, one router replacement expectation). Updated intentional native-document semantics, not disabled tests.
- 21:02:38 public category stub RED8failed,5.81s. 21:04:10 public/scene/exit GREEN3files49passed,41.15s.
- Initial worker test node environment hit global test cleanup window error; removed that test-environment override and reran genuine assertions.
- 21:10:15 worker RED5failed,5.96s: wrong unseen-report shell, missed CSS font, HTML for RSC, unsafe idle-other-client activation, deleted unrelatedcache. 21:13:20 GREEN5passed,5.91s.
- Production build first post-route attempt failed TypeScript because old dynamic scene-page test passed removed server props. Replaced obsolete server-render assertions with exact canonical legacy-shell forwarding, then build succeeded (Next16.3.4,26static outputs including7finite categories).
- 21:16:44 manifest stub RED2failed,5.77s (empty manifest/missing output not rejected). Initial test location scripts excluded by Vitest; moved under configured src test pattern before true RED.
- 21:18:32 manifest/worker/legacy-page GREEN3files13passed,8.21s. Manifest tests subsequently use temporary synthetic installed-output layout, so full unit tests do not require preexisting `.next`; actual output proof is separate below.
- 21:20:49 registration RED2failed7passed,27.55s: missing updateViaCache:none and no visible multi-window defer guidance. 21:22:16 registration+manifest GREEN2files11passed,27.73s.
- 21:23:42 ExitGuard external document-anchor regression RED1failed17passed,29.19s; 21:25:19 GREEN18passed,27.66s. Draft cancellation does not invoke discard/navigation; focus restores to actual clicked anchor.
- 21:28:38 practice repository stub RED8failed,6.82s (both memory/IndexedDB). 21:31:36 6passed2failed due candidate timestamp violating initial-create rule before conflict comparison; changed test to genuinely different valid candidate. Added retry-after-later-progress regression:21:32:32 RED2failed6passed. Fixed exact prefix head comparison, not blind latest overwrite. 21:33:28 repository+gradedbackup GREEN2files10passed,6.89s.
- 21:35:27 expanded repository GREEN17passed,6.55s: independent IDB connections, atomic rollback after turn put failure, memory failure after proposed effects, repair-only vs mixed flow, explicitrefuse vs no-text answer, presentation restore/unknown-version failures.
- 21:37:21 presenter stub RED3failed,6.19s. 21:38:26 presenter+repository GREEN2files20passed,9.06s. Follow-on typecheck found narrowing/test non-null annotations; corrected locally (not fullsuite).
- 21:44:12 lightweight metadata stub RED2failed,6.21s. 21:45:52 GREEN2passed,6.32s.
- 21:47:32 scene-library+presenter26passed1failed,31.93s; remaining old assertion expects mechanical keyword-count label. It will be intentionally replaced with selected-level/current public preparation URL and actual length choices.

## Interim production resource proof (not final bundle / not browser evidence)

Consumer evidence after the initial foundation/persistence gates (same portable Node prefix plus `node_modules/vitest/vitest.mjs run`):
- 21:51:41 `src/features/practice/use-practice-session.test.tsx -t 'pins the selected'`: genuine RED1failed8filtered,6.82s, missing graded snapshot before hook replacement. 21:54:50 full focused hook7passed2failed,8.26s; remaining assertions were old path/random-opening and legacy coach result, intentionally changed to canonical id-query/explicit pinned variant and actual local graded inputs.
- Stage fixture setup first had an incorrect import then wrong provider status (`ready` vs actual `available`); these are test setup errors, not feature RED evidence. 22:04:01 `src/features/practice/practice-stage.test.tsx -t 'shows full selected'`: genuine RED1failed9filtered,19.46s, old stage requires keyword `scene.goals.length` instead of selected graded view.
- 22:07:21 `src/features/practice/practice-stage.test.tsx src/components/feedback-sheet/feedback-sheet.test.tsx`: GREEN2files13passed,24.57s. Current exact question/pair, full situation, partial terminal confirmation, repair-only completion refusal, local audio preview/release, speech fallback, processing/busy ownership and canonical readonly completed view.
- 22:08:28 `src/features/practice/use-practice-session.test.tsx`: GREEN11passed,7.64s. Added edited suggestion remains unknown, mixed repair path reaches pending partial, terminal cannot append, saved pinned v1 restored despite supplied v2 current content, explicit finish evidence, failed quota attempt retains exact ID/time/input for retry. These additions passed directly against guarded implementation; no additional preimplementation RED claim for them.

Portable Node `next build` produced build `mf4qMIdn4_eIi4VtiVa-J`. Actual category artifacts are `.next/server/app/content/v1/{category}.body` + `.meta` with JSON content type; no reliable original dynamic category graph was used. No transcompiler or bundler parsing framework.

Generated fixed-path manifest inventories9real static shell HTML and53public assets. First probe discovered `/practice/today` is an existing redirect to `/practice`, not a separatelyservable shell; removed it from inventory and retained explicit compatibility redirect. `next start --hostname127.0.0.1 --port3113` followed by Node fetch/hash checks proved69resources had matching successful status/finalURL/byte length/SHA256, unknowncategory404. Started process was stopped after probe. No browser actions.

Interim shared bytes4,310,755 (before old-client imports fully removed). Categories:travel730,977;dining777,765;daily739,269;work850,258;social647,543;study665,093;emergency785,820. These are not final savings numbers. Root-approved Ruling19 adds eight existing public scene WebPs183,028bytes and `SceneImage` unoptimized fixed paths; implementation/test/buildproof still pending here.

## Implementation handoff seams and chronological consumer evidence

### Continued consumer evidence / interruption recovery

- 2026-09-10 22:10:55 `vitest run src/features/practice/session-resolver.test.tsx -t 'preserves an old'`: RED1failed4filtered,7.18s; old resolver ran the legacy snapshot instead of rendering readonly transcript.
- 22:13:32 `vitest run src/features/scenes/scene-preparation.test.tsx -t 'loads selected'`: RED1failed1filtered,18.48s; old preparation required legacy `scene.goals.map` instead of loading selected reviewed pack.
- 22:16:00 `vitest run src/features/scenes/scene-preparation.test.tsx src/features/practice/session-resolver.test.tsx`:6passed1failed,19.54s. Remaining failure expected source params in category/level order; actual canonical projection is level/category. Corrected the assertion, not production behavior.
- User interrupted; resumed 2026-09-11 at controller HEAD9308deb, originalBASE unchanged. CIM process command-line lookup denied; read-only Get-Process showed no portable Task3I Node process and netstat showed no3113listener. Unrelated Node processes untouched. Controller145a3da subsequently updates docs only.
- 09:47:09 `vitest run src/features/practice/session-report-view.test.tsx -t 'reports partial coverage'`: RED1failed3filtered,145.46s (slow import108.88s). Captured old rendered `SESSION COMPLETE`, grammar4/4, “这次没有明显错误” for pending partial, missing real pending-confirmation label. Process was already running before replacement; output collected afterward, not rerun retroactively.
- 09:49:09 `vitest run src/features/practice/session-report-view.test.tsx src/features/practice/session-resolver.test.tsx src/features/scenes/scene-preparation.test.tsx`: GREEN3files11passed,23.75s. Preserved historical favorite saving, readonly old transcripts, new selection/source privacy, unavailable retry, and report open/reopen cannot finish.
- 09:50:21 `vitest run src/content/public-category.test.ts -t 'analyzes the contextual'`: RED1failed8filtered,3.34s, PUBLIC_ANALYSIS_NOT_CONNECTED. 09:51:38 `vitest run src/content/public-category.test.ts`: GREEN9passed,5.67s. Work sentence exact only with correct questionId; personal unknown text preserved locally; only fixed `/content/v1/work` requests, unavailable download throws rather than pretending unknown coverage.
- 09:52:31 `vitest run src/features/practice/practice-home.test.tsx`: RED2failed1passed,18.54s; old active-record continuation/level override instead of readonly history and selected-profile new launch.
- 09:54:07 `vitest run src/features/profile/learning-center.test.tsx`: RED1failed,18.37s; missing readonly old-record label/canonical route.

All commands above use the exact portable Node path stated in Runtime followed by `node_modules/vitest/vitest.mjs`; `vitest run` is that executable shorthand, not a global runtime.

- `learning-routes.ts`: typed build/parse/safeSource/semantic identity, canonical legacy URLs, native same-shell `history(null)` and document cross-shell navigation; explicit new-ID replacement. Future notebook paths recognized but no notebook page/tab placeholders.
- `publicContentProvider(fetcher)` + `loadPublicCategory(category,fetcher)`: same-origin fixed `/content/v1/{category}` JSON; no learner text/body/query. Static GET validates public reviewed30packs/category and bounded analyses. Shared engine and public analysis matcher remain local; production controller proof added by Ruling20.
- `repositories.practice.read(id)` obtains one coherent session/turn view (`ready`, `historical`, `recovery`). `commit(create|advance|finish|stop)` runs existing storage.change transaction with exact fresh head and replay guards. Legacy normal saves and learning.recordEvent effects cannot overwrite graded state. Shape-valid missing-row backup remains importable/exportable but recovery-only. No data conversion/DBname/version/store change.
- `PracticeSession.presentation` optional strict version1nonempty max120/500, savedcopy restore; no catalog backfill. `completionEvidence` strict schemaVersion1/ruleVersion1 with canonical identity, independent scene/content/engine versions, mode/variant, path cap, total/expressioncounts, actualpartial/achieved outcome, basis and confirmedAt. Normal terminal remains active until explicit finish. No placeholder events or points.
- Task5 must insert actual synchronous policy/event/plan/ledger/bonus effects inside the existing `practice-repository.ts` finish storage.change after fresh evidence validation; task-provenance finish currently refuses until connected. Do not use report/startup reconciliation or replay of empty events.
- `presentGradedPractice(session,turns)` replays pinned engine actual inputs, returns full situation/persistedrole, currentquestion paired answers, history text blocks and bounded canonical capture sources. Learner/reference/feedback target answered/changed question; assistant next-question block targets renderedquestion; generic repair/closing remains scene-only. No second dialogue engine.

## Continued verification record

### 2026-09-11 continued focused evidence

Same exact portable Node prefix from Runtime, followed by `node_modules/vitest/vitest.mjs run` and the following arguments (not global Vitest):

- 09:55:30 `src/features/practice/practice-home.test.tsx src/features/profile/learning-center.test.tsx src/content/analysis/coffee-analysis.test.ts`: 3 files / 6 passed, 21.49s. Lightweight new-launch metadata and readonly legacy continuation; coffee test filename confirmed against current files, without rerunning historic evidence.
- 09:57:29 `src/components/scene-image/scene-image.test.tsx src/infrastructure/persistence/offline-manifest.test.ts`: 9 failed / 1 passed, 2.71s (optimizer URL and missing eight direct media entries); 09:58:11 GREEN 10 passed, 2.47s.
- 09:59:53 learning-routes focused RED 3 failed / 11 passed, 2.11s; 10:00:45 route-coordinator RED 2 failed, 2.19s; 10:02:45 both files GREEN 16 passed, 2.29s. Canonical invalid selections stay recovery-only, semantic new-ID replacement preserves prior stack, private search never enters local route/scroll history. Exact path names retained in changed-file inventory; historic command output not rerun to regenerate evidence.
- 10:04:10 `src/infrastructure/persistence/offline-worker.test.ts`: 3 failed / 6 passed, 2.06s (actual prior active build mistaken for newest install, legacy deletion, lost clean source); 10:05:28 GREEN 9 passed, 2.06s.
- 10:06:47 service-worker-registration focused build-dismissal RED 1 failed / 9 filtered, 12.42s. 10:08:13 registration + scene-library 33 passed / 1 failed, 26.94s: registration 10 passed; remaining scene preparation expectation was old public query order.
- 10:09:07 `src/features/practice/use-practice-session.test.tsx -t 'retries failed initial'`: 1 failed / 11 filtered, 3.49s (missing retryInitialization). 10:10:20 hook + scene-library 35 passed / 1 failed, 23.52s; hook 12 passed, remaining scene-library synchronous launch expectation did not await the new public pack. Exact historical test-name filter spelling is not recoverable from this continuation context; no new RED is claimed for the fixture correction.
- 10:18:55 `src/infrastructure/persistence/offline-worker.test.ts`: genuine RED 1 failed / 11 passed, 2.10s. A put returning without the activation marker made old-generation cleanup proceed; now deletion also requires reading back the exact bounded marker. Additional quota/client-unknown/readiness cases passed directly and are regression validation, not preimplementation RED.

Activation cache retention is deliberately conservative, not a total storage bound. Only actual activate writes version1 build/generation metadata. Failed/unknown/missing markers and legacy2.3 remain; more than64 owned caches suppress history processing/cleanup. Present windows defer all prior deletion. After a zero-window snapshot the actual immediately prior activated build remains available for a newly arriving old-document lazy request; this is not a global atomic lock. Unactivated caches are never promoted by insertion order. Markerless accumulation can cost storage/quota and require later successful retry; no cleanup UI/framework added. Real multi-window/browser acceptance remains Task7.

Completed implementation gates: hook/stage/resolver/preparation/report, public analysis/client boundary, scene/home/profile canonical adapters, coherent finish/stop/advance races and rollback/reopen, foundation source/scroll/build-dismissal, SceneImage19, five-row polish and aggregate paths. Final self-review, type/lint, actual build/HTTP and full unit suite are now complete as recorded below. Full independent/visual/browser/network/offline/device acceptance remains controller/Task7; Tasks4/5/6 retain the explicit downstream work described in the handoffs.

- 10:19:26 `src/infrastructure/persistence/offline-worker.test.ts src/features/scenes/scene-library.test.tsx`: GREEN36passed,14.87s.
- 10:22:06 `src/infrastructure/persistence/practice-repository.test.ts`: RED2failed21passed,3.87s, completedAt before last actual input or after updatedAt was wrongly resumable. 10:23:08 `src/infrastructure/persistence/practice-repository.test.ts src/infrastructure/persistence/graded-backup.test.ts`: GREEN25passed,4.22s. Social04 A1 real privacy/no answer path, finish/stop and advance/stop races, both finish rollback adapters, fresh actual IDB connection reopening of completed evidence and saved presentation. These added race/reopen assertions passed directly; only timestamp coherence produced new RED.
- 10:24:35 `src/content/dialogues/graded/integration-polish.test.ts`: genuine5failed,2.66s; 10:27:19 GREEN5passed,2.69s. Scope5Q/10A reread with both situations and relevant C1/branch context; changed prose in2Q/7A plus2hints, not all reread wording changed. IDs/effects/accepted-form assembly/versions unchanged. Coffee1row,dining3rows,daily1row annotations reset to draft with edits, final rows reopened before renewing. Teacher0; no new whole-corpus linguistic gate. Exact ledger anchors `#task-3i-polish`.
- 10:27:45 `src/content/public-category.test.ts -t 'rejects truncated'`: genuine1failed9filtered,2.63s; truncated dining analysis inventory accepted. Now exact21dining/6other entries and questionId ownership requires matching scene. 10:28:52 `src/content/public-category.test.ts src/content/dialogues/graded/integration-paths.test.ts`: GREEN11passed,53.29s. Actual asserted counts210units/2520Q/5040A/57analysisentries/630basepaths/1260variantpaths/5040traversals/2520uniqueQreached. Four patterns per variant/mode are allA,allB,alternatingAB,alternatingBA; not exhaustive2^10 combinations. Existing category dependency tests remain in final full suite. Every scene has five distinct full Q/A units; every selected role mapping validates; all traversals reached achieved without reasking or fresh terminal question. Passed directly, no retroactive RED claim.
- 10:29:35 portable `node_modules/typescript/bin/tsc --noEmit`: exit1 one test-only overloaded scrollTo callback typing error; corrected typed number|ScrollToOptions callback. Prior earlier typecheck had three fetcher-mock tuple errors; already fixed. These are diagnostics, not feature RED.
- Changed-file ESLint first pass:7errors,0warnings: six next/no-html-link-for-pages reports on intentional document-shell anchors, one explicit-any fixture. Anchors retain required document navigation with narrow rule-only explanatory file comments; fixture now typed. No functional test disabled. Runtime elapsed not retained for this lint pass.
- 10:31:31 `src/components/app-shell/offline-readiness.test.tsx`: 2failed,2.93s. One genuine detached-controller postMessage failure; one test teardown surfaced global navigator replacement during cleanup. Hook now catches unavailable controller and keeps its original EventTarget for listener cleanup. No false-ready fallback.
- 10:33:27 `src/features/practice/practice-stage.test.tsx -t 'reserves the actual'`: RED1failed10filtered,16.63s, no measured expanded dock reservation. Added ResizeObserver + resize fallback to actual dock space, viewport-limited internally scrollable fixed dock; unchanged palette/image/layout intent. 10:35:34 `src/features/practice/practice-stage.test.tsx src/components/app-shell/offline-readiness.test.tsx src/components/app-shell/route-coordinator.test.tsx src/features/practice/use-practice-session.test.tsx`: GREEN27passed,20.53s. Actual320px/200%-text rendering and virtual-keyboard behavior remain Task7, not proved by mocked geometry.
- 10:38:34 portable tsc + all changed TS/TSX/JS/MJS ESLint: exit0, no diagnostics. Test-only resize callback/audio fixture typing corrections preceded this command. Prettier mechanical formatting used installed3.9.6 on task-owned code/CSS only.
- 10:40:14 repository/report/legacy-page/exit/registration focused:60passed1failed,23.94s; only old duplicate-from array test still expected valid forwarding. Binding parser now intentionally recovery-only for duplicate public options; corrected that assertion to focusable recovery + explicit scene return, not production parser weakening. Existing learning.recordEvent graded-write bypass regression and old feedback fallback display passed directly.
- Ruling20 self-review: uncontrolled first load lacked exact build binding. Controller approved existing-worker bounded proof gate, no new manifest endpoint. 10:42:34 `src/content/public-category-production.test.ts`: genuine4failed,2.97s: no-SW/old-worker/first-control/tampered-response cases previously fetched/accepted; negative promise assertions printed large pack output (truncated) and one asynchronously handled assertion warning. These are not hidden; no warning remained after implementation. 10:43:45 this file + worker GREEN16passed,2.94s. Added no-controller/wrong-source/wrong-request/30-second cancellation regressions passed directly. 10:45:27 `src/content/public-category-production.test.ts src/infrastructure/persistence/offline-worker.test.ts src/features/scenes/scene-preparation.test.tsx src/app/scenes/[slug]/page.test.tsx`: GREEN27passed,11.23s.
- 10:46:24 final post-Ruling20 portable tsc: exit0/no diagnostics, after formatting final source. At this milestone production build and final all-file lint/diff-check were running and full unit had not started; their final results are recorded below.

### Production category verification specifics

`loadPublicCategory` in production calls single-purpose `verifiedCategoryResponse(category, fetcher)`. Up to10seconds covers first controller handoff and version1 `CATEGORY_BUILD` proof; another bounded30seconds covers fetch/body/hash. Existing worker's network obtain still has12second fetch limit, so its earlier failure can surface first. The message contains only category and random requestId; response must match actual controller, requestId, category, bounded buildId, SHA256 and byte count. Actual category fetch gets build/hash response headers only after the same worker verifies/cache-puts the exact resource. Adapter recomputes bytes/hash and rejects any intervening controller change, redirects, missing headers or failed proof. Old2.3 does not implement this protocol and cannot authorize unverified new practice. HTTPS/Safari/SW restrictions, safe `/practice` update-return and retry guidance remain visible; no controller means no new production category-dependent practice/analysis. Saved snapshot resume/historical/backup never call this gate. Dev mode intentionally uses public strict schema load without production SW proof and explicitly discloses that on preparation. No generic RPC, second manifest endpoint, user text or audio requests.

## Exact downstream API handoff (Tasks4/5/6)

All paths below are relative to the preserved worktree. No next-task UI, placeholder completion event, five-tab activation, generic router or new engine is included.

### Public content / local analysis — Task4

`src/content/public-category.ts` exports:

```ts
loadPublicCategory(category: string, fetcher?: typeof fetch): Promise<PublicCategory>
publicContentProvider(fetcher?: typeof fetch): ContentProvider
publicLearningAssistant(fetcher?: typeof fetch): LearningAssistantProvider
// Existing ContentProvider:
load({sceneId, level, contentVersion?}: ContentRequest): Promise<ContentResult>
// ContentResult: available+pack | unavailable | version-unavailable+requestedVersion
// Existing LearningAssistantProvider:
analyze({sceneId?, intent?, questionId?, kind, text, level}: AnalysisRequest): Promise<AnalysisResult>
// kind: word | phrase | sentence
// result: status exact | partial | unknown, originalText, entries,
// explanationZh, capabilities ['save','note','self-recall']
```

Task4 client imports these public adapters, not `localContentProvider` or `localLearningAssistant` (authored modules are build/test-side only; type-only imports are fine). Only fixed public category path is fetched. Unknown scene gives unknown analysis without downloading; known-scene download/proof failure rejects and must present retry, not false unknown coverage. After the data arrives `matchAuthoredAnalysis` uses original local exact/contextual matching. “Could we test that assumption?” is exact only for `work-05` + `meeting-disagreement.C1.assumption`; absent question context remains non-exact. No user wording reaches worker messages or requests. Analysis text is preserved; exact forms are finite, not general grammar/translation/phoneme analysis.

`src/domain/practice/graded-presenter.ts` exports `presentGradedPractice(session: PracticeSession, turns: PracticeTurn[])`. Call with the coherent ready record from `repositories.practice.read`, not separately fetched mismatched rows. Result supplies `opening: PracticeTextBlock[]`, `history[]` with `turnId,input,confirmation,learner,assistant[],references[],feedback`, `currentQuestion` with `id,text,hintZh,source,answers[]`, `flow,outcome,canAnswer,canFinish,situationZh,presentation`.

```ts
interface PracticeCaptureSource {
  sceneId: string; level: CefrLevel; sessionId: string;
  turnId?: string; questionId?: string;
}
interface PracticeTextBlock { text: string; source: PracticeCaptureSource }
```

Use EACH block's source, never one turn-level “current question” for both sides. Learner/reference/answer-feedback target the answered or explicitly changed question. Assistant's exact next-question segment targets its rendered question; preceding repair hint and terminal/generic mixed text have no fabricated questionId. Opening/current suggestions have no invented turnId. The presenter replays existing engine with pinned pack and actual recorded inputs; no second state engine/source table persisted. Legacy ungraded transcript has no inferred new source. Task4 owns actual selection/capture/note UI and its existing bounded source persistence port.

### Coherent persistence / atomic completion — Task5

`Repositories` now has `practice: PracticeRepository` from the SAME memory/IndexedDB factory, backed by existing `LocalStoragePort.read/change` transactions:

```ts
interface PracticeRecord {
  session: PracticeSession; turns: PracticeTurn[];
  status: 'ready' | 'historical' | 'recovery'; message?: string;
}
type PracticeChange =
  | {kind:'create'; session:PracticeSession}
  | {kind:'advance'; expected:PracticeSession; turnId:string; input:DialogueInput; at:string}
  | {kind:'finish'|'stop'; expected:PracticeSession; at:string};
read(id:string): Promise<PracticeRecord|undefined>
commit(change:PracticeChange): Promise<{applied:boolean; record:PracticeRecord}>
```

Fresh-head comparison is full expected-session equality inside write transaction. Advance saves actual input-derived snapshot and exact dialogue turn atomically; retries reuse original turnId/input/time/expected. An exact older retry returns current committed head without dropping later progress. Conflicting ID/input and stale new writes reject, no auto-rebase. Source/replay validation rejects mismatched opening/row order/count/text/reply/time and unsupported snapshot. `PracticeSession` optional `presentation` (schemaVersion1, nonblank120/500 chars) and `completionEvidence` (strictschemaVersion1/ruleVersion1) preserve sceneVersion independently of contentVersion. Both adapters and v1/v2 backup validation updated; database remains `speakmate-v1`, version2, same12stores, MAX_BACKUP_BYTES remains10MiB. No user-data migration, clearing or new store; unknown versions reject before restore writes. Shape-valid but incoherent imported snapshots remain preserved/exportable recovery-only, not silently repaired.

`practiceFlow(snapshot)` returns `{requiredUserTurns,submittedTurns,expressionTurns,basis}`. Rulev1 cap is selected variant/mode path length, and all inputs including help/unknown/change count. Eligible finish means normal terminalpartial/achieved at cap + ≥1nonempty answer/change, or genuinely achieved earlier with expression. Pure repair exhaustion, refuse/stop and active unfinished flow cannot finish. Engine partial/achieved remains separate from workflow status: last normal turn leaves statusactive pending confirmation; only explicit finish writes statuscompleted, completedAt and evidence. Explicit `refuse` is stop UI “停止本次练习”, never keyword-detected natural refusal. `stop` preserves snapshot as abandoned without evidence/awards. Report open/reopen is read-only.

Durable evidence includes sessionId/sceneId/sceneVersion/level/contentVersion/engineVersion/mode/variantId, pathcap/submitted/expressioncounts, actualpartial|achieved outcome, path-cap|achieved basis, confirmedAt. No new learningEvent or points is emitted. Task5 must integrate its REAL policy + event + plan + ledger + bonus writes INSIDE `practice-repository.ts` finish's existing synchronous `storage.change`, after fresh-head/evidence checks and before publishing completed session. The explicit comment identifies this single seam; keep evidence+effects+status all-or-nothing. Do NOT call `learning.recordEvent` afterward or reconcile from completed-session on app start. Current `provenance` sessions refuse finish with TASK_SETTLEMENT_NOT_CONNECTED until this atomic extension exists. Ordinary sessions/turns/saveTurnAndSession and learning.recordEvent effect ports reject writes into graded sessions; actual bypass attempts are tested. Existing provenance survives restore and retries; new task-linked selection/provenance creation remains Task5's real launch integration, not URL-embedded personal/task prose.

### URL / launch / presentation — Tasks4/5/6

`src/components/app-shell/learning-routes.ts`: `buildLearningHref(target)`, `parseLearningTarget(href) -> {status:'valid',target}|{status:'invalid',message}`, `safeSourceHref(href?)`, `canonicalLegacyHref(href, includeFrom=true)`, `semanticRouteIdentity(href)`, `navigateLearning(target, replace=false)`, `navigateLocalHref(href, replace=false)`, `replaceCreatedSessionId(id)`. `documentNavigation` supplies only native assign/replace; not a parallel router. Invoke navigation after existing ExitGuard has released pending audio/draft work.

Targets: session `{kind:'session',id,scene?,level?,mode?,round?,from?}`, report/note `{kind:'report'|'note',id,from?}`, simulation `{kind:'simulation',id,source?,from?}`, prepare `{kind:'prepare',scene,level?,mode?,from?}`. Fixed paths are `/session`, `/session/report`, `/notebook/note`, `/notebook/simulation`, `/scenes/prepare`; notebook destinations are type-recognized only and NOT implemented/pre-cached. Opaqueids1..120, slug≤100, URL≤2000; missing/invalid/duplicate/unknown params recover without creation. Explicit new session still requires actual known scene at resolver; new simulation requires local source; note/report reject idnew. Native same-shell History(null) updates filters/identity; cross-shell native document navigation supports unseen IDs offline. New-ID replacement only replaces current entry, preserves origin/round/mode, and synchronizes bounded local route stack without copying Next private state. Old exact session/new/id/report and scene/slug URLs forward canonically; invalid duplicate options remain recovery. `/offline/session` no longer guesses a new session.

Scene preparation launches canonical selected scene/level/mode with clean source. `PreparedPractice extends SceneMetadata` adds `{level,pack,mode,variantId,presentation?}`. `selectedPracticePresentation(pack, variantId)` uses explicit canonical roles and selected level/variant validation; current reviewed variants retain mapped roles across levels, with study/travel advanced rehearsal framing. First authored variant is current preparation UI default; all variants are covered in engine/integration tests and the PreparedPractice port, not exposed through an invented URL variant selector. Full selected situation remains before/during practice. Old coherent graded missing presentation gets neutral saved-practice wording, never today's role backfill. Emergency is authored communication rehearsal, not actual clinician/dispatcher/service.

Scene private search is local≤200chars over≤24 filter entries (`rememberSceneFilters`, `restoreSceneFilters`, independent `sceneFilterIdentity`); only publiclevel/category/duration serialize. Legacyq can be locally restored then removed; prior external request cannot be recalled. Route/scroll stack bounded24clean entries with storage-denial fallback; no late title focus on explicitback, bounded3second DOM scroll restoration. Task6 owns final five-tab activation, keyboard/focus/320px+landscape/200% whole-page acceptance; Task7 owns browser traces. New note/simulation pages MUST add their real static shells to `scripts/offline-manifest.mjs` and tests when built; current9shells do not claim those future destinations ready.

## Final production artifact and HTTP evidence

Portable `node_modules/next/dist/bin/next build` began10:47:20 and exited0 before10:50:04. Installed Next16.3.4/Turbopack: compile6.3s, framework TypeScript95s,26static outputs. Framework TypeScript was notably slower than direct tsc while other checks ran; no timeout/failure. Then portable `scripts/offline-manifest.mjs` exited0, buildId `zH4_m4tGFox5I5Rl7qb40`,9shells/60sharedassets/7categories. Shared shell+JS+CSS+fonts+icons+eightmedia bytes4,484,602. This is conservative all-shared-public inventory, not a tree-shaken minimal-download claim.

Port3113 checked unused before starting portable `node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3113`; Ready358ms. 10:51:14 portable `.superpowers/sdd/2026-09-09-speakmate-3/task-3i-production-check.mjs` exited0 (3.09s wall):76resources all200 with exact finalURL/contenttype/bytes/SHA256, three previously-unvisited fixed-shell query variants identical to respective shell bytes, unknowncategory404. Script retained with report for reproducibility. Generated offline-build.js exactly equals actual artifact manifest; no serverJS/maps exported. Forty-two authored C1 opening sentinels absent from shared JS; source import review separately confirms clients use only public-data ports, not authored fallback. Sentinels alone are not a complete dependency proof. Test HTTP is ordinary loopback Node fetch, not browser/SW acceptance. Started server stopped via its exact execution session after probe; no broad process kill.

|Category URL suffix|Bytes|SHA256|
|---|---:|---|
|travel|730977|23701882a185e592f5c4ae4b6be5da49fb0f61cb1c57a84d3bb5e40f9ef8a68e|
|dining|777819|261975b5f97fbd057ae91c2d807a35505dd49ce239cf568480ae15bebecf3d67|
|daily|739410|64216845529806bc9f12d36591b84f143bc0793620ba440f01d11341a8210c2b|
|work|850258|266d828bedd6f944f9376d6ba529e765190d34c6936ad104c7f94ba4d500eb3b|
|social|647543|80296c1db04f17df5f6193ddd79d87cb203bba0b418995848ed4a0c3c391f08b|
|study|665093|9effeed4c166c3d297bf2c07b40f5ed17d246026e64c2229a056caf72198adc4|
|emergency|785820|f5fabb3a5fd3d42139d18c848c60cae0293521c4333dd349037706aa2ca2aa59|

Each fixed `/content/v1/category` comes from actual `.next/server/app/content/v1/category.body` with JSON `.meta`; no inferred chunk-name categorization. Manifest category bytes are not part of shared install set.

|Existing scene WebP|Bytes|SHA256|
|---|---:|---|
|travel|17150|1943dc932837d542318fe1aa5f626ad9e18a47b34fc6f0dc30ef53228334e88e|
|dining|30820|5c4fbb2dce1df7dd91db164e8d33cf2368ee5157fb202bd8f1137bc08f84d30c|
|daily|27816|756a4618ed1f2a4b6169304a51e12e5f6c2cefbbde587cf4be84637140e08405|
|work|22724|eb7cd700a4fbc632e6105eabc3e1918e6ca6dc472e1c8feb0b4919008b087574|
|social|11890|b3492ce5871d4bd5056a0fa55a9b71dfa60869a37d6156c7bce8a30f380fb713|
|study|22644|b7916f1c65d7d385b1623ade687f9b98b40b879a34e0d14b4842bf38cbcfc5a2|
|emergency|21950|4a063e593d9091411384a4f9deaf84f8eb2d4e080f258ef0b1bf7c340a7c43f5|
|hotel|28034|305b23554679689b4b0b8c66566dbcf3cf80d315b56f1b3fcc2dea52aa50e9c9|

Scene media total183028bytes; fixed direct sources preservefill/alt/focal/priority/lazy and avoid guessed optimizer variants. Dynamic responsive re-encoding is intentionally lost only for these small existing images.

## Final self-review / complete-suite status

Self-review checked requirements against actual interfaces and final source/diffs: static-vs-RSC routing and private-source projection; new-ID and pending ExitGuard behavior; production controller proof/old2.3 boundaries; category-vs-shared inventory; coherent replay and both storage adapters; finished evidence with no rewards/event reconciliation; strict optional snapshots/backup and independent scene/content versions; per-block source targeting; exact/unknown/repair truthfulness; terminal/readonly consumers; scene/social/study/emergency authored-role framing; strict local recording/ASR/TTS/settings; existing eight media; isolated five-row English polish. React review motivated memoizing pinned presenter replay by record rather than replaying on every audio-amplitude update; expanded text dock gets measured space and bounded viewport scrolling. No new dependency/service/cloud/DB/MySQL, retired engine/router workaround, notebook/goals placeholder or five-tab activation. No framework/API version changes; controller docs preserved through338c47b.

Corrections found during self-review are recorded with RED/GREEN above: unsupported legacy query, local history source/scroll, actual-active cache retention/read-back, initial-create retry, confirmation timestamps, analysis ownership/count, detached controller, expanded dock and first-use build proof. Legacy `TurnFeedback` fallback is now actually rendered, explicitly historical. Grade-write bypass via learning.recordEvent aborts without even adding its candidate event. Remaining distinctions are deliberate: normal terminal is still active until confirmation; ungraded records readonly; coherent no-presentation graded uses neutral label; unknown/damaged imported records preserved recovery-only.

Final changed-file lint10:51:42–10:51:58 exited0/no diagnostics. An earlier combined command used `git -c core.autocrlf=false diff --check` and incorrectly treated existing CRLF lines in `.gitignore`/package.json as whitespace changes; ordinary repository `git diff --check`10:50:04 exited0 with only LF→CRLF notices. No source rewrite was made for that command-level diagnostic.

First complete unit command: portable `node_modules/vitest/vitest.mjs run`, started10:50:27,223.34s: **6154passed/1failed**,72files (71passed/1failed). Sole failure `src/components/app-shell/app-shell.test.tsx` expected `['/scenes?q=hotel&level=B1']` in route-stack. Actual `['/scenes?level=B1']` correctly removes private search; focus preservation assertion already passed. Updated only that obsolete expectation, not the privacy implementation or test scope. Controller approved preserving same-page query/focus/local-search assertions and correcting this obsolete persisted-route expectation. Runtime/build artifacts have not changed, so no redundant rebuild was done for a test-only change.

Focused confirmation: portable `node_modules/vitest/vitest.mjs run src/components/app-shell/app-shell.test.tsx`,10:55:25,12.90s: **11passed**. Necessary final complete command: portable `node_modules/vitest/vitest.mjs run`, Vitest start10:56:06,109.32s, exit0:

```text
Test Files  72 passed (72)
     Tests  6155 passed (6155)
  Duration  109.32s (transform 21.53s, setup 83.19s, import 588.26s,
                   tests 482.83s, environment 224.21s)
```

Final direct portable `node_modules/typescript/bin/tsc --noEmit`10:46:24 exit0 preceded the final build; only the test expectation and report/proof packaging changed afterward. Final changed-file lint exit0 is recorded above. No test was removed/skipped to produce GREEN. The full-suite repeat was required by the observed failure, not a second routine verification run.

Remaining honest limitations: independent Task3I review is pending; no real browser/SW cold-start, Safari/iPhone, offline reload, two-window race/network trace, virtual-keyboard/320px/landscape/200%-text or deployment/release acceptance. Native document navigation can send opaque IDs/public options to same-origin hosting; never promises URL IDs cannot be seen remotely. Legacy external q requests already sent cannot be recalled. Build manifest is installed Next16.3.4-specific and must fail/receive maintenance if output changes; browser cache eviction/quota/private-mode/unsupported SW can disable new production content loads. Unknown caches may accumulate; retention is conservative, not globally bounded storage or a cross-window lock. Updated worker retains legacy2.3 resources but cannot retroactively add correct unseen shells to an already-running old2.3 script before update. Finite curated matching is not general speech/grammar/semantic correctness; all model-assisted language review remains teacher0. Task4/5/6/7 must use the real ports above and add actual destinations/policy/browser evidence rather than infer them from this integration.
