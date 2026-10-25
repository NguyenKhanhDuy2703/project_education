# Remove Legacy Demo Scripts - Execution Plan & Working Memory

> **Status**: COMPLETE
> **Goal**: Remove the obsolete `scripts/` recording utilities while preserving the generated demo assets referenced by README files.

### Task 1: Remove demo sources
- [x] Delete `scripts/demo_workspace.html`.
  - Verify: file no longer exists.
- [x] Delete `scripts/record_demo.py`.
  - Verify: file no longer exists.
- [x] Delete `scripts/record_real_app_demo.py`.
  - Verify: file no longer exists.

### Task 2: Final audit
- [x] Confirm `scripts/` contains no files and remove the empty directory.
- [x] Confirm `docs/assets/demo-*` and README references remain intact.
- [x] Review Git status to ensure no unrelated files were changed by this cleanup.
