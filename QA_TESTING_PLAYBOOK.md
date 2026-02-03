# Budget It - QA Testing Playbook

## Overview
This playbook provides comprehensive testing scenarios for Budget It, a privacy-focused personal finance Progressive Web App.

## Test Environment Setup
1. **Browser**: Chrome, Firefox, Safari, Edge (latest versions)
2. **Modes**: Light mode and Dark mode
3. **Devices**: Desktop, Tablet, Mobile
4. **Data State**: Fresh install, With demo data, With user data

---

## 1. Initial Setup & Onboarding

### Test 1.1: First Launch
- [ ] App loads successfully
- [ ] Welcome wizard appears
- [ ] Dark/Light mode toggle works
- [ ] "Add Demo Data" button visible

### Test 1.2: Demo Data
- [ ] Click "Add Demo Data"
- [ ] Accounts appear in Dashboard
- [ ] Transactions appear in Transactions tab
- [ ] Categories are populated
- [ ] Net worth displays correctly

### Test 1.3: Skip Demo
- [ ] Click "Skip" in welcome wizard
- [ ] Dashboard shows empty state
- [ ] Prompts to add first account/transaction

---

## 2. Account Management

### Test 2.1: Create Asset Account
- [ ] Navigate to Accounts page
- [ ] Click "Add Account"
- [ ] Select "Asset" category
- [ ] Choose "Checking" type
- [ ] Enter name: "Test Checking"
- [ ] Enter balance: $1,234.56
- [ ] Verify comma formatting displays: "$1,234.56"
- [ ] Save successfully
- [ ] Account appears in list
- [ ] Balance shown correctly

### Test 2.2: Create Liability Account
- [ ] Add account with "Liability" category
- [ ] Choose "Credit Card" type
- [ ] Enter balance: $500
- [ ] Enter interest rate: 18.99%
- [ ] Enter minimum payment: $25
- [ ] Check "Revolving debt"
- [ ] Save and verify

### Test 2.3: Edit Account
- [ ] Click edit on existing account
- [ ] Change balance to $2,000
- [ ] Verify comma formatting
- [ ] Save changes
- [ ] Verify updated balance displays

### Test 2.4: Delete Account
- [ ] Delete an account
- [ ] Confirm deletion prompt
- [ ] Verify account removed from list
- [ ] Verify net worth updated

---

## 3. Transaction Management

### Test 3.1: Add Transaction
- [ ] Go to Transactions tab
- [ ] Click "Add"
- [ ] Select account
- [ ] Enter description: "Grocery Shopping"
- [ ] Enter amount: $45.67
- [ ] Verify comma formatting
- [ ] Select category: "Food & Dining"
- [ ] Select date (today)
- [ ] Save transaction
- [ ] Verify appears in list

### Test 3.2: Inline Category Edit
- [ ] Click category badge on transaction
- [ ] Dropdown appears with categories grouped
- [ ] Change to different category
- [ ] Verify category updates immediately
- [ ] Click outside to close dropdown

### Test 3.3: Edit Transaction
- [ ] Click edit on transaction
- [ ] Change amount to $67.89
- [ ] Change category
- [ ] Save changes
- [ ] Verify updates display

### Test 3.4: Delete Transaction
- [ ] Delete a transaction
- [ ] Confirm deletion
- [ ] Verify removed from list
- [ ] Verify totals updated

### Test 3.5: Filter Transactions
- [ ] Use search box to find transaction
- [ ] Filter by account
- [ ] Filter by category
- [ ] Filter by type (Income/Expense)
- [ ] Clear all filters
- [ ] Verify counts update correctly

---

## 4. CSV Import

### Test 4.1: Select Account
- [ ] Click "Import CSV"
- [ ] See "Step 1: Select Account" prominently
- [ ] Upload button disabled until account selected
- [ ] Select checking account
- [ ] Upload button enabled

### Test 4.2: Upload & Auto-Detection
- [ ] Upload sample CSV with columns: "Trans. Date", "Description", "Amount"
- [ ] Mapping table appears showing CSV columns
- [ ] "Trans. Date" auto-mapped to "Date"
- [ ] "Description" auto-mapped to "Description"
- [ ] "Amount" auto-mapped to "Amount"
- [ ] Extra columns marked as "Unused"
- [ ] Sample values displayed

### Test 4.3: Manual Mapping
- [ ] Change a dropdown from auto-detected value
- [ ] Set a column to "Unused"
- [ ] Try mapping two columns to same field (should show error)
- [ ] Click "Preview Import"
- [ ] Verify validation catches missing required fields

### Test 4.4: Preview & Import
- [ ] See preview table with transactions
- [ ] See count: "X transactions ready"
- [ ] See errors for invalid rows
- [ ] Click "Import X Transactions"
- [ ] Success message appears
- [ ] Transactions appear in list
- [ ] Totals updated correctly

---

## 5. Dashboard

### Test 5.1: Net Worth Card
- [ ] Net worth displays correctly
- [ ] Color coding (green if positive, red if negative)
- [ ] Updates when accounts/transactions change

### Test 5.2: Date Range Filter
- [ ] Date range dropdown displays
- [ ] Select "Current Month"
- [ ] Select "Last 3 Months"
- [ ] Select "Custom Range"
- [ ] Enter custom start/end dates
- [ ] Verify all charts update

### Test 5.3: Monthly Snapshot
- [ ] Shows selected period label (not always "This Month")
- [ ] Displays income, expenses, savings rate
- [ ] Values update with date range changes

### Test 5.4: Spending by Category Chart
- [ ] Pie chart displays
- [ ] Labels visible in dark mode
- [ ] Hover tooltip works (dark mode aware)
- [ ] Shows "No expenses" when no data

### Test 5.5: Income vs Expenses Chart
- [ ] Bar chart displays 6 or 12 months based on selection
- [ ] Bars visible and colored correctly
- [ ] Axis labels visible in dark mode
- [ ] Tooltip works in dark mode

---

## 6. Analysis Tabs

### Test 6.1: Cash Flow Sankey
- [ ] Navigate to Analysis > Cash Flow
- [ ] Sankey diagram displays
- [ ] Income flows to expenses (not transfers)
- [ ] Transfers excluded from flow
- [ ] Node labels visible

### Test 6.2: Account Balances
- [ ] Navigate to Analysis > Balances
- [ ] Accounts grouped by type
- [ ] Progress bars show percentages
- [ ] Total Assets/Liabilities/Net Worth cards display
- [ ] Envelope budgeting tip shown

### Test 6.3: Debt Payoff
- [ ] Navigate to Analysis > Debt Payoff
- [ ] Add liability accounts if none exist
- [ ] See debt list with balances
- [ ] Select "Avalanche" strategy
- [ ] Select "Snowball" strategy
- [ ] Enter extra payment amount
- [ ] See payoff timeline
- [ ] Verify calculations

### Test 6.4: Recurring Transactions
- [ ] Navigate to Analysis > Recurring
- [ ] See detected recurring patterns
- [ ] Confidence scores displayed
- [ ] Create recurring rule
- [ ] Edit/delete rules

### Test 6.5: Investment Planner
- [ ] Navigate to Analysis > Investments
- [ ] Enter portfolio value (e.g., $100,000)
- [ ] Verify comma formatting
- [ ] Enter monthly contribution (e.g., $500)
- [ ] Enter expected return (%): 7
- [ ] Enter years: 30
- [ ] See projected future value
- [ ] See inflation-adjusted value

### Test 6.6: Investment Planner - Monte Carlo
- [ ] Click "Run Simulation"
- [ ] Enter volatility: 15%
- [ ] Chart displays with probability bands
- [ ] Colors visible (not washed out)
- [ ] Hover tooltip works in dark mode
- [ ] Legend readable
- [ ] Median line clearly visible
- [ ] See percentile stats (10th, 25th, 50th, 75th, 90th)

### Test 6.7: Portfolio Mix
- [ ] Navigate to Analysis > Portfolio Mix
- [ ] Enter birthdate
- [ ] Enter first withdrawal date
- [ ] Enter annual withdrawal amount (e.g., $40,000)
- [ ] Verify comma formatting
- [ ] Enter portfolio amount (e.g., $500,000)
- [ ] Verify comma formatting
- [ ] Click "Calculate Recommendation"
- [ ] See asset allocation pie chart
- [ ] Labels visible in dark mode
- [ ] See ETF recommendations table
- [ ] See rationale section

### Test 6.8: Escrow Calculator (NEW)
- [ ] Navigate to Analysis > Escrow
- [ ] Click "Add Item"
- [ ] Enter name: "Property Tax"
- [ ] Enter amount: $3,000
- [ ] Select frequency: "Annual"
- [ ] Enter next due date
- [ ] Save item
- [ ] See item in list
- [ ] Annual cost updates
- [ ] Target balance updates

### Test 6.9: Escrow - Contribution Calculator
- [ ] Select pay frequency: "Biweekly"
- [ ] Enter next pay date
- [ ] Enter target date (1 year from now)
- [ ] See "Per Paycheck" amount calculated
- [ ] Add another escrow item
- [ ] Verify per-paycheck amount updates
- [ ] Change pay frequency to "Monthly"
- [ ] Verify calculation updates

### Test 6.10: Escrow - Edit/Delete
- [ ] Edit an escrow item
- [ ] Change amount
- [ ] Verify calculations update
- [ ] Delete an escrow item
- [ ] Confirm deletion
- [ ] Verify item removed
- [ ] Verify totals updated

### Test 6.11: Scenarios (What-If Analysis)
- [ ] Navigate to Analysis > Scenarios
- [ ] See current baseline (3-month average)
- [ ] Check "Income Change" scenario
- [ ] Click +/- toggle to make negative
- [ ] Enter amount: -$500 (income decrease)
- [ ] Verify button shows minus icon (red)
- [ ] See impact: income decreases by $500

### Test 6.12: Scenarios - Multiple Scenarios
- [ ] Add "Expense Change" scenario
- [ ] Set to positive $100 (new subscription)
- [ ] Verify button shows plus icon (red for expense increase)
- [ ] Enable both scenarios
- [ ] See combined impact on monthly net
- [ ] See projected net worth change
- [ ] Change timeframe to 2 years
- [ ] Verify projections update

### Test 6.13: Scenarios - Add/Remove
- [ ] Click "Add Scenario"
- [ ] New scenario appears
- [ ] Enter custom description
- [ ] Remove a scenario
- [ ] Verify calculations update

---

## 7. Settings

### Test 7.1: Dark Mode Toggle
- [ ] Go to Settings
- [ ] Toggle dark mode
- [ ] Verify all pages switch themes
- [ ] Verify charts readable in both modes
- [ ] Verify tooltips readable in both modes

### Test 7.2: Category Management
- [ ] Add custom category
- [ ] Choose color
- [ ] Save category
- [ ] Edit category
- [ ] Delete non-system category
- [ ] Verify system categories can't be deleted

### Test 7.3: Data Export
- [ ] Click "Export Data"
- [ ] JSON file downloads
- [ ] File contains all accounts, transactions, categories

### Test 7.4: Data Import
- [ ] Click "Import Data"
- [ ] Select previously exported JSON
- [ ] Confirm import
- [ ] Verify all data restored

---

## 8. Dark Mode Specific Tests

### Test 8.1: Chart Visibility
- [ ] Enable dark mode
- [ ] Check Monte Carlo chart - colors visible
- [ ] Check Income vs Expenses - bars visible
- [ ] Check Spending by Category - labels readable
- [ ] Check Portfolio Mix - pie chart labels visible
- [ ] Check Cash Flow Sankey - nodes/labels visible

### Test 8.2: Tooltip Visibility
- [ ] Hover over Monte Carlo chart
- [ ] Tooltip has dark background with light text
- [ ] Text clearly readable
- [ ] Repeat for all charts
- [ ] Verify no white-on-white text

---

## 9. Currency Formatting

### Test 9.1: Input Fields
- [ ] Enter amount in any currency input: 12345
- [ ] Tab away from field
- [ ] Verify displays: $12,345.00
- [ ] Edit to 1234567
- [ ] Verify displays: $1,234,567.00

### Test 9.2: Display Values
- [ ] Transaction totals show commas
- [ ] Net worth shows commas
- [ ] Account balances show commas
- [ ] Analysis values show commas
- [ ] Dashboard values show commas

---

## 10. Data Persistence

### Test 10.1: Analysis Data Saved
- [ ] Enter data in Investment Planner
- [ ] Refresh page
- [ ] Return to Investment Planner
- [ ] Verify data still there (FUTURE: Not yet implemented for all tabs)

### Test 10.2: Escrow Data Saved
- [ ] Add escrow items
- [ ] Refresh page
- [ ] Return to Escrow tab
- [ ] Verify all items still there

### Test 10.3: LocalStorage
- [ ] Open browser DevTools
- [ ] Check Application > IndexedDB > BudgetItDB
- [ ] Verify tables: accounts, transactions, categories, escrowItems, analysisData

---

## 11. Mobile Responsiveness

### Test 11.1: Mobile Layout
- [ ] Open on mobile device (or DevTools responsive mode)
- [ ] Bottom navigation visible
- [ ] Cards stack vertically
- [ ] Tables scroll horizontally if needed
- [ ] Buttons appropriately sized

### Test 11.2: Touch Interactions
- [ ] Tap to select categories
- [ ] Tap to open modals
- [ ] Tap to edit transactions
- [ ] Swipe actions work (if implemented)

---

## 12. Edge Cases & Error Handling

### Test 12.1: Invalid CSV
- [ ] Upload CSV with missing required columns
- [ ] Verify clear error message
- [ ] Upload CSV with invalid date formats
- [ ] Verify error shown for specific rows

### Test 12.2: Empty States
- [ ] View Dashboard with no accounts
- [ ] Verify helpful empty state message
- [ ] View Transactions with no data
- [ ] Verify "Add First Transaction" prompt

### Test 12.3: Large Data Sets
- [ ] Import CSV with 1000+ transactions
- [ ] Verify performance acceptable
- [ ] Verify charts render correctly
- [ ] Verify filtering still responsive

### Test 12.4: Negative Balances
- [ ] Create account with negative balance
- [ ] Verify displays correctly
- [ ] Verify net worth calculation correct

---

## 13. PWA Features

### Test 13.1: Install
- [ ] See "Install App" prompt in browser
- [ ] Install to home screen
- [ ] Launch from home screen
- [ ] Verify works like native app

### Test 13.2: Offline
- [ ] Open app while online
- [ ] Disconnect internet
- [ ] Verify app still loads
- [ ] Verify data still accessible
- [ ] Verify offline indicator (if implemented)

---

## Test Sign-Off

**Tester Name**: _______________
**Date**: _______________
**Build Version**: _______________
**Environment**: _______________

**Overall Status**: ☐ Pass ☐ Fail ☐ Pass with Issues

**Issues Found**:
1.
2.
3.

**Notes**:
