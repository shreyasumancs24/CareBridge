# Troubleshooting Log

This log contains only issues observed during repository inspection and development. No application implementation errors have occurred because feature development has not started.

## 2026-10-22 — Git resolves to the home directory

- **Description:** Running `git rev-parse --show-toplevel` from `C:\Users\hp\carebridge` returned `C:/Users/hp`. Git status consequently listed unrelated home-directory files instead of giving a project-scoped change list.
- **Context:** Initial repository inspection.
- **Root cause:** The project directory has no `.git` directory and is being discovered under a repository rooted at the home directory. The intended repository arrangement is not yet known.
- **Diagnosis:** Checked that `.git` is absent in the project root and ran `git rev-parse --show-toplevel` from the project directory.
- **Fix:** No repository changes were made. This is unresolved; confirm or establish the intended Git repository boundary before committing or publishing.
- **Verification:** Git still reports `C:/Users/hp` as the root; `Test-Path .git` in the project returns false.
- **Lesson:** Git commands use the nearest parent repository. A command run in a project folder can still affect or report a parent repository if the project itself has no `.git` directory.

No other development errors or fixes have been recorded.
