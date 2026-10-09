# Mandatory Requirement Elicitation & Socratic Interrogation Rule

## 1. Core Mandate
Whenever the user proposes a new feature, architecture design, authorization change, or system enhancement:
**DO NOT jump directly into writing implementation code.**
The agent MUST invoke the **Requirement Elicitation & Socratic Interrogation Protocol** by default.

---

## 2. Default Interrogation Protocol

### Step 1: Deep Socratic Probing
- Never accept ambiguous, high-level, or unclarified requirements.
- Never silently pick an interpretation when multiple viable options exist.
- Formulate penetrating, counter-challenging questions across 6 core pillars:
  1. **Business Scope & Granularity**: Action-level vs Module-level vs Resource-level permissions.
  2. **Security & Authorization**: Override models (Deny-Override vs Allow-Override), privilege escalation risks.
  3. **Data Model & Schema**: Tables, relationships, constraints, lifecycle, expiration timestamps.
  4. **Edge Cases & Conflict Resolution**: Role vs User overrides, simultaneous actions, suspended accounts.
  5. **Performance & Caching**: Real-time evaluation vs Token-based eventual consistency, Redis / DB lookup overhead.
  6. **UI/UX Workflows**: Restricted student view (hidden vs disabled vs error modal), Admin studio configuration UX.

### Step 2: Multi-Round Interrogation
- Group questions systematically into thematic rounds.
- Continue grilling and probing round-by-round until all edge cases, exceptions, and business rules are 100% clear.
- Do not hesitate to ask detailed questions — the user has explicitly requested maximum depth.

### Step 3: Architecture Specification First
- Once all rounds of questions are answered, synthesize a comprehensive **Architecture & Technical Specification Document**.
- Seek user confirmation before modifying or generating codebase files.
