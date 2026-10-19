# MODULE_ADMIN — Admin & Contributor Control Plane

> Part of the **[study-web](https://github.com/NguyenKhanhDuy2703/study-web)** educational platform.

`MODULE_ADMIN` is the dedicated administrative portal and contributor workspace for `study-web`. It empowers course creators, pedagogical contributors, and platform administrators to author interactive labs, review submissions through a structured state machine, manage user access, and configure dynamic enterprise entitlements.

---

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
- **Language**: TypeScript 5+ (Strict mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Code Editor**: [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)
- **State Management**: [TanStack React Query v5](https://tanstack.com/query/latest) + [Redux Toolkit](https://redux-toolkit.js.org/)
- **Testing**: [Vitest](https://vitest.dev/) + Happy-DOM + React Testing Library

---

## ✨ Core Features & Pages

| Page / Route | Component | Purpose |
|:---|:---|:---|
| `/admin/dashboard` | `AdminDashboardPage` | High-level metrics: active learners, pending reviews, submission statistics |
| `/admin/labs/studio` | `AdminLabStudioPage` | Markdown-First authoring studio with live student preview and AST validator |
| `/admin/review` | `AdminReviewPage` | Review queue for evaluating contributor lab submissions against quality guidelines |
| `/admin/users` | `AdminUsersPage` | User account directory, plan assignment, and direct feature override toggles |
| `/admin/groups` | `AdminGroupsPage` | Enterprise organization management and group-based IAM policies |
| `/admin/contributor-applications` | `AdminContributorApplicationsPage` | Application review portal for aspiring curriculum contributors |
| `/admin/audit` | `AdminAuditPage` | Immutable audit trails of permission changes, role assignments, and publishes |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- Running instance of `MODULE_BE` (default: `http://localhost:3000`)

### Installation & Development
```bash
# Navigate to MODULE_ADMIN
cd MODULE_ADMIN

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The portal runs by default at `http://localhost:5174` (or next available port).

---

## 🧪 Testing & Production Build

```bash
# Run unit and component test suites (Vitest - 40 tests across 5 suites)
npm run test

# Type-check and produce optimized production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🏛 System Integration

`MODULE_ADMIN` communicates with `MODULE_BE` via cookie-based JWT authentication (`HttpOnly` session tokens). Users must possess the `Admin` or `Contributor` role to access administrative endpoints, enforced via NestJS `EntitlementsGuard`.
