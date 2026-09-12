# Initial consumer run — harness interruption, not application RED

Command: Node22 `outputs/qa/final-fix/run-evidence.mjs outputs/qa/final-fix/red-consumers.json <Node22> node_modules/vitest/vitest.mjs run src/features/practice/session-rounds.test.tsx src/features/notebook/notebook-entry.test.tsx src/features/notebook/report-capture.test.tsx`.

Owned exec session19206 emitted only `RUN v4.1.11 D:/Codex-chat/SpeakMate/.worktrees/speakmate-3`; no completed tests or assertions were reported during repeated bounded waits. Interrupted with Ctrl-C, exit1. The wrapper could not save a close-event artifact when the entire session was interrupted. This is not a passing run or proof of an application failure. Subsequent isolated runs are separately retained. Read-only process metadata query was denied; no process-kill command or unknown-server action occurred.
