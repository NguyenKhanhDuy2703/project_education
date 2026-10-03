## Feature Name
<!-- Short, descriptive feature name. E.g.: Google OAuth2 + Session Authentication -->


## Description of Changes
<!-- Summary of what this PR does and why the change is needed -->


## Related Tasks
<!-- Link to related Jira issue or task -->
- Task: <!-- [BE-XXX / FE-XXX](jira_link) -->
- Closes #

## Scope of Changes

| Module | Description of Changes | Changed |
|--------|------------------------|:-------:|
| `MODULE_BE` — Backend (NestJS / Prisma / Auth) | <!-- E.g.: Added API, updated service, migration --> | [ ] |
| `MODULE_FE` — Frontend (React / Canvas) | <!-- E.g.: Added component, updated UI --> | [ ] |
| `.github/workflows` — CI/CD Pipeline | <!-- E.g.: Added job, updated trigger --> | [ ] |
| `docs/` — Documentation | <!-- E.g.: Updated README, added plan --> | [ ] |
| `packages/` — Shared packages | <!-- E.g.: Updated cv-contracts, types --> | [ ] |
| Other | <!-- Specify --> | [ ] |

## Test Results

### Test Commands
```bash
# cd MODULE_BE && npm test
# cd MODULE_FE && npm test
```

### Execution Results
<!-- Terminal output after running tests -->
```
# Paste output here
```

### Test Cases

| # | Test case | Input | Expected output | Status |
|---|-----------|-------|-----------------|--------|
| 1 |           |       |                 | Pass / Fail |
| 2 |           |       |                 | Pass / Fail |
| 3 |           |       |                 | Pass / Fail |

<!-- Examples:
| 1 | Valid login credentials | { account: "user1", password: "abc" } | 200 OK + accessToken | Pass |
| 2 | Incorrect password       | { account: "user1", password: "bad" } | 401 Unauthorized     | Pass |
| 3 | Expired token            | Bearer <expired_token>                | 401 Unauthorized     | Pass |
-->

## Self-review Checklist
- [ ] Local tests passed successfully (`npm test`)
- [ ] Local build succeeded (`npm run build`)
- [ ] No `.env` files or sensitive information committed
- [ ] No merge conflict markers (`<<<<<<< HEAD`)
- [ ] Commit messages follow Conventional Commits format (`feat(be): ...`)
- [ ] No changes outside task scope (no drive-by refactoring)

## Breaking Changes
- [ ] No breaking changes
- [ ] Breaking changes introduced → describe below:

<!-- Describe breaking changes and migration steps if applicable -->

## Notes for Reviewer
<!-- Additional context, design decisions, or areas needing attention -->
