# Budget It

A privacy-focused personal finance Progressive Web App (PWA) that runs entirely in your browser. Track accounts, categorize transactions, analyze cash flow, optimize debt payoff, and plan investments—all without sending your data anywhere.

## Features

### Core Functionality
- **Account Management**: Track asset accounts (checking, savings, investments) and liability accounts (credit cards, loans, mortgages)
- **Transaction Management**: Import, categorize, and analyze your financial transactions
- **Smart Categorization**: Auto-apply categories to matching transactions
- **Dashboard**: Real-time overview of net worth, monthly cash flow, and savings rate
- **Data Privacy**: All data stored locally in your browser (IndexedDB) - never sent to any server

### Financial Analysis
- **Cash Flow Visualization**: Sankey diagrams showing money flow from income to expenses
- **Debt Payoff Strategies**: Avalanche (highest interest first) and snowball (smallest balance first) calculators
- **Investment Planning**: Withdrawal bucket allocation and portfolio projections
- **What-If Scenarios**: Model different financial decisions

### Data Management
- **Import/Export**: Export all data as JSON for backups, import from previous exports
- **CSV Import**: Import transactions from bank/credit card CSV files
- **Privacy First**: Zero server communication, complete data control

### PWA Features
- **Offline Support**: Works without internet connection
- **Mobile Optimized**: Responsive design, touch-friendly interface
- **Installable**: Add to home screen on mobile devices
- **Dark Mode**: System-aware dark theme

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Database**: Dexie (IndexedDB wrapper)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts, D3-Sankey
- **Date Handling**: date-fns
- **PWA**: vite-plugin-pwa

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/Budget-It.git
cd Budget-It

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
# Build the app
npm run build

# Preview production build
npm run preview
```

### Deploying to GitHub Pages

```bash
# Deploy to GitHub Pages
npm run deploy
```

Or push to the `main` branch and GitHub Actions will automatically deploy.

## Usage Guide

### 1. Setting Up Accounts

1. Navigate to the **Accounts** tab
2. Click **Add Account**
3. Choose account type (Asset or Liability)
4. Fill in account details
   - For assets: name, balance, institution
   - For liabilities: additionally interest rate, minimum payment, term

### 2. Managing Transactions

1. Navigate to the **Transactions** tab
2. Add transactions manually or import from CSV
3. Categorize transactions by selecting a category
4. Use auto-apply to categorize future matching transactions

### 3. Importing Transactions

1. Go to **Transactions** → **Import CSV**
2. Upload your bank's CSV export
3. Map columns (date, description, amount)
4. Preview and confirm import

### 4. Analyzing Your Finances

- **Dashboard**: View net worth, monthly summary, recent transactions
- **Analysis Tab**:
  - Cash Flow: Sankey diagram of income → expenses
  - Debt Payoff: Compare strategies and see timelines
  - Investments: Plan withdrawals and allocations
  - Scenarios: Model "what-if" situations

### 5. Data Backup

1. Go to **Settings** → **Data Management**
2. Click **Export All Data** to download JSON backup
3. Store backup securely
4. Import when needed with **Import Data**

## Privacy & Security

- **No Accounts Required**: No signup, no login, no email
- **Local Storage Only**: All data stays in your browser's IndexedDB
- **No Tracking**: No analytics, no cookies, no external calls
- **Export Anytime**: Full data export in standard JSON format
- **Open Source**: Audit the code yourself
- **Security Reviewed**: Comprehensive security analysis completed (see SECURITY.md)
- **Content Security Policy**: CSP headers implemented for defense-in-depth

## Project Structure

```
src/
├── components/      # React components
│   ├── Accounts/    # Account management components
│   ├── Dashboard/   # Dashboard widgets
│   ├── Layout/      # App shell and navigation
│   ├── Settings/    # Settings and data management
│   └── ui/          # Reusable UI components
├── db/              # Database schema and initialization
├── hooks/           # Custom React hooks
├── pages/           # Page components
├── store/           # Zustand state stores
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── App.tsx          # Main app component
└── main.tsx         # App entry point
```

## Development Status

### Completed ✅
- ✅ **Core Infrastructure**
  - Project setup with Vite + React + TypeScript
  - Database layer with Dexie (IndexedDB wrapper)
  - State management with Zustand
  - App shell with bottom navigation
  - Dark mode with system preference detection
  - PWA configuration with offline support
  - GitHub Pages deployment with GitHub Actions

- ✅ **Account Management**
  - Full CRUD for asset and liability accounts
  - Support for checking, savings, credit cards, loans, mortgages
  - Interest rate and minimum payment tracking
  - Net worth calculation

- ✅ **Transaction Management**
  - Transaction list with advanced filtering
  - Manual transaction entry with validation
  - CSV import with intelligent column mapping
  - Auto-categorization (apply to future or all matching transactions)
  - Search and filter by account, category, or type

- ✅ **Category Management**
  - Create custom income/expense/transfer categories
  - 16 preset colors with hex color support
  - Protected system categories
  - Visual category indicators

- ✅ **Dashboard & Analytics**
  - Net worth summary cards
  - Monthly income/expense snapshot with savings rate
  - Spending by category pie chart
  - Income vs expenses trend (last 6 months)
  - Recent transactions widget

- ✅ **Debt Optimization**
  - Avalanche method (highest interest first)
  - Snowball method (smallest balance first)
  - Side-by-side comparison with savings calculation
  - Payoff timeline and interest projections
  - Adjustable extra payment slider

- ✅ **Recurring Transactions**
  - Automatic pattern detection (weekly, monthly, quarterly, yearly)
  - Confidence scoring based on interval consistency
  - Cash flow projection (1-12 months ahead)
  - Next occurrence prediction

- ✅ **Data Management**
  - Export all data as JSON
  - Import with replace or merge modes
  - Data validation and error handling
  - Backup and restore functionality

- ✅ **UI/UX Polish**
  - Accessible forms with ARIA labels
  - Keyboard navigation support
  - Focus management in modals
  - Loading states and error handling
  - Empty states with helpful messaging
  - Responsive design (mobile-first)
  - Performance optimizations (debouncing, memoization)

- ✅ **Advanced Analysis Tools**
  - Cash flow Sankey diagram (D3 visualization)
  - Investment planner with bucket strategy
  - Compound interest calculator with projections
  - What-if scenario modeling (income/expense/savings/debt)
  - Side-by-side scenario comparison

- ✅ **User Experience**
  - Welcome wizard with demo data option
  - 60+ sample transactions for exploration
  - Guided onboarding flow
  - Privacy-focused messaging

- ✅ **Security**
  - Comprehensive security review completed
  - Content Security Policy (CSP) headers implemented
  - XSS prevention via React auto-escaping
  - Input validation on all forms (Zod schemas)
  - No dangerouslySetInnerHTML usage
  - Secure file upload handling (CSV/JSON validation)
  - Modern, maintained dependencies

### Planned 📋
- 📋 Monte Carlo simulation for retirement projections
- 📋 Automated test suite (Vitest + React Testing Library)
- 📋 Budget vs actual tracking with variance analysis
- 📋 Financial health score calculation
- 📋 Goal tracking with progress visualization
- 📋 Transaction tagging and custom fields

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with privacy and user control as core principles
- Inspired by the need for a truly local-first finance app
- No data ever leaves your device

---

**Note**: This app is for personal financial tracking and educational purposes. Always consult with a qualified financial advisor for professional financial advice.
