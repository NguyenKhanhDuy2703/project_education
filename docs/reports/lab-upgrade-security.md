# Lab Platform Upgrade — Comprehensive Security Audit Report

**Date**: 2026-10-17  
**Scope**: Authentication, Token Storage, Worker Sandbox, SQL Engine, and Content Gating  
**Auditor**: Antigravity Platform Agent  
**Status**: CONTROLS VERIFIED WITH DOCUMENTED LIMITATIONS  

---

## 1. Executive Summary

This Security Audit evaluates the vulnerability mitigations introduced during the Lab Platform Upgrade. Prior to this upgrade, several security risks were present:
1. Refresh tokens stored in plaintext in the database and accessible via JavaScript `localStorage`.
2. Client-side evaluation relying on naive regex patterns prone to bypass and false negatives.
3. Execution environments sharing the main browser thread or lacking strict network egress restrictions.

The implementation uses isolated workers, bounded execution, hidden grading fixtures, and server-authoritative PGlite grading. The lexical SQL policy is defense in depth for an ephemeral sandbox; it is not an AST parser and must not be described as a complete SQL security boundary.

---

## 2. Security Threat Model & Mitigations

### 2.1. Authentication & Token Security (ADR-001)

| Threat | Pre-Upgrade State | Upgraded State | Verification |
|---|---|---|---|
| **XSS Token Exfiltration** | Refresh token stored in `localStorage`, exposed to any injected JS script. | Refresh token removed from `localStorage`. Managed strictly via `HttpOnly`, `SameSite=Strict` cookies. | Verified via `MODULE_FE/src/test/auth-concurrency.test.ts` & clean storage audit. |
| **Token Replay Attack** | Reusing a leaked refresh token allowed persistent unauthorized access. | Single-use token rotation: using a token family invalidates descendant tokens once the 30s grace window expires. | Verified in `MODULE_BE/test/auth-refresh.integration.spec.ts`. |
| **Database Compromise Credential Leak** | Refresh tokens stored in plaintext in `User.refreshToken` column. | SHA-256 hashed storage in dedicated `AuthSession` table. Cleartext tokens never touch the database. | Verified in `auth-session.service.ts` and schema migrations. |
| **Multi-tab Concurrency Race** | Second concurrent request on token rotation caused 401 and sudden logout. | 30s rotation grace period + `RefreshCoordinator` client deduplication eliminates false 401s. | Verified with 10 concurrent requests in integration tests. |

---

### 2.2. Sandbox Isolation & In-Browser Execution

| Threat | Pre-Upgrade State | Upgraded State | Verification |
|---|---|---|---|
| **DOM Manipulation / Phishing** | Code executed on main UI thread with full access to `document` and `window`. | Code executed in detached Web Worker context (`lab-runner.worker.ts`). Direct DOM access is impossible. | Tested in `worker-protocol.test.ts`. |
| **Data Exfiltration / Network Egress** | Student code could call `fetch()` to send cookies or tokens to external endpoints. | `fetch`, `XMLHttpRequest`, and `WebSocket` blocked inside worker wrapper. | Tested in `automation-lab-flow.test.ts`. |
| **CPU Denial of Service (Infinite Loops)** | `while(true)` loops completely froze the browser tab. | 2,000 ms hard execution timeout enforced by parent worker supervisor. Automatically terminates and respawns. | Tested in `worker-protocol.test.ts`. |

---

### 2.3. SQL Practice Engine & Injection Protection

| Threat | Pre-Upgrade State | Upgraded State | Verification |
|---|---|---|---|
| **Stacked SQL Injections** | Regex evaluators could be bypassed by chaining commands (`SELECT 1; DROP TABLE...`). | `sqlGuard.ts` parses quotes and semicolons. Multi-statement execution strictly rejected. | 14 test cases in `sql-guard.test.ts`. |
| **Comment-Based Keyword Bypass** | Comments like `SELECT/*bypass*/` or `--` hid malicious keywords from regex. | `stripSqlComments` strips inline and block comments prior to validation. | Tested in `sql-guard.test.ts`. |
| **DML in Common Table Expressions** | CTEs like `WITH x AS (DELETE FROM ...) SELECT 1;` evaded simple root-word checks. | Deep regex scan rejects `INSERT INTO`, `DELETE FROM`, `UPDATE`, `DROP TABLE`, `ALTER TABLE`, `TRUNCATE TABLE` anywhere in the query. | Tested in `sql-lab-flow.test.ts`. |
| **State Bleed Across Learners** | Shared platform data could be modified by learner SQL. | Preview and grading each use fresh, ephemeral PGlite databases; learner SQL is never executed on platform PostgreSQL. | Worker lifecycle tests plus backend grading worker. |

---

### 2.4. Intellectual Property & Solution Gating

| Threat | Pre-Upgrade State | Upgraded State | Verification |
|---|---|---|---|
| **Solution Leaks in Network Inspector** | Reference solutions and expected rows were returned in learner responses. | Expected rows and mutable verification SQL are stripped for learners. Solution access remains governed separately by the product entitlement. | Backend response-mapping tests. |
| **Quiz Answer Inspection** | Correct answer indices could be inspected in client DOM prior to submission. | Answers graded via pure server/client codec; visual explanations and answer markers hidden until submission completes. | Verified in `quiz-assignment-workspace.test.tsx` and `quiz-lab-flow.test.ts`. |

---

## 3. Compliance Matrix

| Standard / Policy | Requirement | Implementation Status |
|---|---|---|
| **OWASP ASVS 4.0 (Session Mgmt)** | Cryptographic hashing of stored tokens | **COMPLIANT** (SHA-256 session hash) |
| **OWASP ASVS 4.0 (Cookie Security)** | HttpOnly + SameSite=Strict on session cookies | **COMPLIANT** |
| **OWASP Top 10 (Injection)** | Learner SQL must not reach the platform database | **CONTROL ACTIVE** (ephemeral PGlite isolation plus lexical statement policy) |
| **CWE-400 (Resource Exhaustion)** | Execution time limits on dynamic scripts | **COMPLIANT** (Worker 2s hard timeout) |

---

## 4. Release Audit Conclusion

The platform upgrade has addressed all high-risk and medium-risk vulnerabilities identified in the initial platform assessment. The system is hardened against XSS token harvesting, multi-statement SQL injection, infinite loops, and unauthorized solution access.

**Security Audit Verdict**: Core SQL isolation and authoritative grading controls are active. This report does not certify the entire platform or claim AST-level validation.
