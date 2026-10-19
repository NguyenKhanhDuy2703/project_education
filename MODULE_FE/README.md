# MODULE_FE — Learner Web Application

> Part of the **[study-web](https://github.com/NguyenKhanhDuy2703/study-web)** educational platform.

`MODULE_FE` is the primary interactive learning frontend for `study-web`. It delivers an ultra-fast, responsive single-page application where developers engage with hands-on lab series, execute SQL queries directly in-browser using WebAssembly, and receive automated real-time test feedback.

---

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
- **Language**: TypeScript 5+ (Strict mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Code Editor**: [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)
- **In-Browser Database**: [@electric-sql/pglite](https://pglite.dev/) (PostgreSQL WASM in Web Worker)
- **State & Data**: [TanStack React Query v5](https://tanstack.com/query/latest) + [Redux Toolkit](https://redux-toolkit.js.org/)
- **Linter & Tools**: [Oxlint](https://oxc.rs/)
- **Testing**: [Vitest](https://vitest.dev/) + Happy-DOM + React Testing Library (182 tests across 37 suites)

---

## ✨ Core Interactive Workspaces

### 1. In-Browser SQL Workspace (`SqlPracticeWorkspace.tsx`)
- Executes queries against a real PostgreSQL engine running inside an isolated Web Worker via **PGlite WASM**.
- Evaluates AST query structure with client-side `sqlGuard` to prevent unwanted state mutations.
- Instant diff comparisons against reference solutions with zero cloud latency.

### 2. Automation Test Workspace (`AutomationTestWorkspace.tsx`)
- Browser-sandboxed Web Worker test runner.
- Custom matcher library (Jest-compatible) enabling learners to write unit and integration tests for sample APIs.

### 3. Continuous Quiz Assignment (`QuizAssignmentWorkspace.tsx`)
- Continuous-scroll pedagogical design with question palette navigation and instant submission grading.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- Running instance of `MODULE_BE` (default: `http://localhost:3000`)

### Installation & Development
```bash
# Navigate to MODULE_FE
cd MODULE_FE

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The application runs by default at `http://localhost:5173`.

---

## 🧪 Testing & Production Build

```bash
# Run the complete test suite (182 tests across 37 suites)
npm run test

# Run Oxlint fast code analysis
npm run lint

# Compile TypeScript and generate production assets
npm run build

# Preview production build locally
npm run preview
```
