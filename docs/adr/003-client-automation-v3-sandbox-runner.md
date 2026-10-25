# ADR-003: Client-Side Fixture Runner & Zero-Browser Automation V3 Architecture

- Status: Accepted
- Date: 2026-10-22
- Owners: Learning Platform & QA Automation Architecture

## Context

Low-code test automation learners need interactive feedback executing UI actions (`click`, `fill`, `check`, `selectOption`) and web-first assertions (`toBeVisible`, `toHaveText`, `toHaveValue`) against real DOM components. Running full headless Chromium, Firefox, or WebKit instances on the backend server for thousands of concurrent learners introduces massive compute costs, cold-start latency (1-3s per runner), severe vulnerability to container escapes or fork-bombs, and complex cluster orchestration.

The platform requires an architecture that provides instant sub-100ms feedback on the learner's machine while ensuring zero backend browser execution, strict client-side sandbox isolation, tamper resistance, and clean export to standard Playwright TypeScript code.

## Decision

1. **Client RAM Execution**:
   - All interactive test execution, DOM action dispatching, and assertion checks execute entirely on the learner's client device using their own RAM and CPU.
   - Target web applications run as versioned, isolated micro-fixtures inside a sandboxed `<iframe>` (`sandbox="allow-scripts"` without `allow-same-origin`, `allow-top-navigation`, or `allow-modals`).
2. **Web Worker Compilation & Deterministic DSL**:
   - The user constructs test scenarios using a constrained Declarative Step Plan composed of allowlisted blocks (`Locator`, `Action`, `Assertion`, `Data`).
   - A dedicated AST compiler translates the visual plan into idiomatic, standalone Playwright TypeScript code (`.spec.ts`) following AAA (Arrange-Act-Assert) conventions and resilient locators (`getByRole`, `getByLabel`, `getByText`).
   - Arbitrary JavaScript execution is strictly prohibited within block mode.
3. **Execution Resource Limits & Safety Guards**:
   - Execution is bounded by a **2000ms hard Timeout Guard**.
   - Capped at a maximum of **50 steps** per execution plan.
   - Capped at a maximum of **100 log lines** per execution cycle.
   - Outbound network requests (`fetch`, `XMLHttpRequest`, `WebSocket`, dynamic scripts) are trapped and prevented by security runtime wrappers.
   - Resetting or unmounting tears down the sandbox state completely, ensuring 0 memory leaks across 20+ execution cycles.
4. **Zero-Browser Backend Authority**:
   - The backend server (`MODULE_BE`) **never spawns browser processes**.
   - Learner submissions encode a versioned Base64 payload containing `exerciseRevision`, `stepPlan`, `answers`, `generatedPlaywrightCode`, `resultSummary`, and `durationMs`.
   - The server validates the declarative step plan against a hidden, private `gradingKey` (enforcing required steps, disallowed steps, minimum step counts, and parameter matchers).
   - Authoritative progress is granted exclusively when server-side declarative validation succeeds.

## Trust Boundary

- **Trusted**: Published lab configuration stored in backend database, private `gradingKey` with server validation rules, backend `AutomationV3Validator`.
- **Untrusted**: Browser DOM execution state, client-reported `status: 'passed'`, client timings, generated Playwright text sent from client.
- **Public Learner Envelope**: Instructions, starter plan, allowed blocks, public check descriptions, fixture ID/route.
- **Hidden Server Envelope**: `gradingKey` (required steps, hidden verification checks, forbidden patterns, reference solution plan).

## Failure Policy

- If an action or assertion fails inside the iframe sandbox, the runner immediately halts, highlights the failing DOM element, marks the step in red, and provides an actionable diff and hint without revealing the full solution.
- If execution exceeds 2000ms, the timeout guard disarms the runner, terminates the cycle, and resets the fixture to its initial route.
- If a submitted payload has an invalid revision, malformed Base64, or missing required steps from `gradingKey`, the backend rejects it with `400 Bad Request` and no progress is awarded.

## Consequences

- **Cost & Scalability**: Zero server GPU/browser infrastructure costs; unlimited horizontal scale for test execution.
- **Speed & Ergonomics**: Instant action feedback (<50ms DOM interaction) with visible highlight rings directly in the fixture preview.
- **Security**: Complete immunity against server-side SSRF or remote code execution via browser exploits.
- **Pedagogical Value**: Learners inspect both high-level visual step blocks and production-ready Playwright TypeScript code side-by-side.
