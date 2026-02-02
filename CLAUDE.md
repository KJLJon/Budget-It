# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Budget It is a privacy-focused personal finance Progressive Web App that runs entirely client-side with no backend server. All data is stored locally in the browser's IndexedDB via Dexie, and never transmitted to any server. The app supports account management, transaction tracking, CSV imports, financial analysis (cash flow, debt payoff strategies, investment planning), and data export/import for backups.

## Development Commands

**IMPORTANT: This project runs in Docker. All npm commands must be run using the Docker container.**

### Docker Setup

The project uses a Docker container with Node.js LTS. Use this pattern for all npm commands:

```bash
docker run -it -p 5173:5173 -v "$(pwd)":/app -w "/app" node:lts <npm command>
```

### Local Development
```bash
# Install dependencies
docker run -it -v "$(pwd)":/app -w "/app" node:lts npm install

# Start dev server at http://localhost:5173
docker run -it -p 5173:5173 -v "$(pwd)":/app -w "/app" node:lts npm run dev -- --host

# Preview production build locally
docker run -it -p 5173:5173 -v "$(pwd)":/app -w "/app" node:lts npm run preview -- --host
```

### Building & Deployment
```bash
# TypeScript compilation + Vite build (outputs to dist/)
docker run -it -v "$(pwd)":/app -w "/app" node:lts npm run build

# Build and deploy to GitHub Pages using gh-pages
docker run -it -v "$(pwd)":/app -w "/app" node:lts npm run deploy
```

### Testing
```bash
# Run tests with Vitest (single run)
docker run -it -v "$(pwd)":/app -w "/app" node:lts npm test

# Run tests in watch mode
docker run -it -v "$(pwd)":/app -w "/app" node:lts npm run test:watch
```

Note: Test suite is planned but not yet implemented. Tests use Vitest configured with `globals: true` and `environment: 'node'`.

### Why Docker?

The `--host` flag is required for `npm run dev` and `npm run preview` to allow connections from outside the container. Port 5173 is exposed for Vite's dev server.

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript (strict mode)
- **Build**: Vite with PWA plugin (vite-plugin-pwa)
- **Styling**: TailwindCSS with dark mode support
- **State Management**: Zustand stores (no Redux)
- **Database**: Dexie (IndexedDB wrapper) - local-first, no server
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for standard charts, D3 (d3-sankey, d3-scale, d3-shape) for Sankey diagrams
- **Utilities**: date-fns (dates), papaparse (CSV), react-hot-toast (notifications)

### Data Layer Architecture

**Database Schema** (`src/db/index.ts`):
- The app uses a single Dexie database class (`BudgetDatabase`) with 7 tables
- Tables: `accounts`, `transactions`, `categories`, `recurringRules`, `investmentPlans`, `settings`, `profiles`
- Database is initialized on app startup with default data (categories, settings, profile)
- All IDs are UUIDs generated via `crypto.randomUUID()`

**State Management Pattern**:
- Each domain has a Zustand store in `src/store/`:
  - `useAccountStore` - CRUD for accounts, net worth calculations
  - `useTransactionStore` - Transaction management, filtering
  - `useCategoryStore` - Category management
  - `useSettingsStore` - App settings (currency, dark mode, etc.)
  - `useProfileStore` - Financial profiles
- Stores fetch from Dexie on mount and sync changes bidirectionally
- Pattern: stores contain both data and business logic (getTotalAssets, getNetWorth, etc.)

**Data Flow**:
1. Components call store actions (e.g., `addAccount`)
2. Store updates Dexie database
3. Store updates in-memory state
4. React re-renders components subscribed to that store slice

### Component Structure

**Pages** (`src/pages/`):
- Top-level route components: Dashboard, Accounts, Transactions, Analysis, Settings
- Pages compose domain-specific components from `src/components/`

**Component Organization**:
- `src/components/Accounts/` - Account cards, forms
- `src/components/Dashboard/` - Net worth card, charts, recent transactions
- `src/components/Transactions/` - Transaction list, forms, CSV import
- `src/components/Analysis/` - Cash flow Sankey, debt payoff calculator, investment planner, scenarios
- `src/components/Settings/` - Category management, data import/export
- `src/components/Layout/` - App shell, header, bottom navigation
- `src/components/Onboarding/` - Welcome wizard with demo data option
- `src/components/ui/` - Reusable primitives (Button, Modal, Input, Select, etc.)

**Routing**:
- Custom hook-based routing via `src/hooks/useRouter.ts` (no react-router)
- Routes stored in localStorage, updated via `navigateTo(route)`
- Available routes: 'dashboard', 'accounts', 'transactions', 'analysis', 'settings'
- Bottom navigation in `src/components/Layout/BottomNav.tsx`

### Utilities & Business Logic

Key utility modules in `src/utils/`:
- `csvParser.ts` - CSV parsing with column mapping, date/currency sanitization
- `dataManagement.ts` - Import/export all data as JSON, backup/restore functionality
- `debtPayoff.ts` - Avalanche & snowball method calculations, payment schedules
- `recurringDetection.ts` - Pattern detection for recurring transactions
- `investmentCalc.ts` - Compound interest, withdrawal bucket strategies
- `monteCarloSimulation.ts` - Retirement projection simulations (planned feature)
- `demoData.ts` - Sample accounts and transactions for welcome wizard

### TypeScript Types

All types defined in `src/types/index.ts`:
- Core entities: `Account`, `Transaction`, `Category`, `RecurringRule`, `InvestmentPlan`, `AppSettings`, `FinancialProfile`
- Enums: `AccountCategory`, `AccountType`, `CategoryType`, `AssetClass`
- Accounts have `category: 'asset' | 'liability'` for net worth calculations
- Liabilities include fields for `interestRate`, `minimumPayment`, `termMonths`
- Transactions support auto-categorization via matching rules

### Path Aliases

The codebase uses `@/*` as an alias for `src/*`:
- Configured in `tsconfig.json` (`paths: {"@/*": ["./src/*"]}`)
- Configured in `vite.config.ts` (`resolve.alias`)
- Example: `import { db } from '@/db'`

### PWA Configuration

Configured in `vite.config.ts`:
- Auto-update service worker (no manual prompts)
- Offline support with Workbox
- App installable on mobile devices
- Base path: `/Budget-It/` for GitHub Pages deployment

### Important Conventions

**Security**:
- No `dangerouslySetInnerHTML` usage anywhere
- All user input validated with Zod schemas
- React auto-escaping protects against XSS
- CSV/JSON imports validated before processing
- See SECURITY.md for comprehensive security review

**Data Privacy**:
- No server communication whatsoever
- No analytics, tracking, or cookies
- All data stays in browser's IndexedDB
- Users must manually export for backups

**Form Handling**:
- All forms use React Hook Form + Zod resolvers
- Forms in modals manage focus and ARIA labels
- Validation errors displayed inline

**Dark Mode**:
- System preference detection on load
- Manual toggle in settings
- Applied via Tailwind's `dark:` classes
- Stored in `settings.darkMode` (persisted to Dexie)

**Currency Formatting**:
- Use `src/utils/currency.ts` for consistent formatting
- Respects `settings.currency` (default: USD)
- Amounts stored as numbers, formatted for display

## Common Development Tasks

### Adding a New Transaction Category
1. Add to `getDefaultCategories()` in `src/db/index.ts` with type, color, and `isSystem: false`
2. Categories are auto-loaded on app initialization

### Adding a New Store
1. Create `src/store/useXStore.ts` following the pattern in `useAccountStore.ts`
2. Define interface with state + actions
3. Use Dexie table for persistence
4. Export from `src/store/index.ts`

### Creating a New Page
1. Add page component to `src/pages/`
2. Export from `src/pages/index.ts`
3. Add route to `useRouter.ts` route type
4. Add navigation link in `src/components/Layout/BottomNav.tsx`
5. Add case to `renderPage()` switch in `src/App.tsx`

### Modifying Database Schema
1. Update types in `src/types/index.ts`
2. Update table interface in `src/db/index.ts`
3. Increment Dexie version number: `this.version(2).stores({...})`
4. Add migration logic if needed for existing users

### CSV Import Column Mapping
- CSV import in `src/components/Transactions/CSVImport.tsx`
- Uses `src/utils/csvParser.ts` for parsing
- Auto-detects date/amount/description columns
- Sanitizes currency (removes $, handles parentheses for negatives)
- Date parsing via date-fns with multiple format attempts

## GitHub Pages Deployment

- Base URL configured as `/Budget-It/` in `vite.config.ts`
- GitHub Actions workflow (`.github/workflows/deploy.yml`) auto-deploys on push to `main`
- Manual deployment: `npm run deploy` (uses gh-pages package)
- Requires `pages` write permission in repository settings

## Known Limitations

- No backend = no cloud sync between devices
- Data stored in IndexedDB = cleared if browser data cleared
- Physical device access = full data access (no encryption at rest)
- Shared computers are a security risk (document in user guidance)
- Service worker caching can cause stale UI (auto-update mitigates this)
