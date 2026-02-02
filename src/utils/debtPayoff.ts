import { addMonths } from 'date-fns';
import type { Account } from '@/types';

export interface DebtPayoffSchedule {
  accountId: string;
  accountName: string;
  payments: PaymentSchedule[];
  totalInterest: number;
  payoffDate: string;
}

export interface PaymentSchedule {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface DebtPayoffResult {
  strategy: 'avalanche' | 'snowball';
  debts: DebtPayoffSchedule[];
  totalMonths: number;
  totalInterest: number;
  totalPaid: number;
}

/**
 * Calculate debt payoff using the avalanche method (highest interest rate first)
 */
export function calculateAvalanche(
  liabilities: Account[],
  extraPayment: number
): DebtPayoffResult {
  // Sort by interest rate descending
  const sorted = [...liabilities].sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0));
  return calculatePayoffSchedule(sorted, extraPayment, 'avalanche');
}

/**
 * Calculate debt payoff using the snowball method (smallest balance first)
 */
export function calculateSnowball(
  liabilities: Account[],
  extraPayment: number
): DebtPayoffResult {
  // Sort by balance ascending
  const sorted = [...liabilities].sort((a, b) => Math.abs(a.balance) - Math.abs(b.balance));
  return calculatePayoffSchedule(sorted, extraPayment, 'snowball');
}

function calculatePayoffSchedule(
  debts: Account[],
  extraPayment: number,
  strategy: 'avalanche' | 'snowball'
): DebtPayoffResult {
  const schedules: DebtPayoffSchedule[] = [];
  let totalInterest = 0;
  let totalPaid = 0;

  // Track current balances
  const currentBalances = debts.map((d) => Math.abs(d.balance));
  const currentPayments = debts.map((d) => d.minimumPayment || 0);

  let month = 0;
  const startDate = new Date();

  while (currentBalances.some((b) => b > 0) && month < 600) {
    // Safety limit: 50 years
    month++;

    // Build available extra: user extra + freed minimums from paid-off debts
    let remainingExtra = extraPayment;
    debts.forEach((_debt, index) => {
      if (currentBalances[index] <= 0) {
        remainingExtra += currentPayments[index];
      }
    });

    debts.forEach((debt, index) => {
      if (currentBalances[index] <= 0) return;

      const balance = currentBalances[index];
      const rate = (debt.interestRate || 0) / 100 / 12; // Monthly rate
      const minPayment = currentPayments[index];

      // Calculate interest for this month
      const interest = balance * rate;

      // Total payment = minimum + extra (if this is the priority debt)
      let payment = minPayment;
      if (remainingExtra > 0) {
        payment += remainingExtra;
        remainingExtra = 0;
      }

      // Ensure we don't overpay; return excess to the pool for next debt
      const maxPayment = balance + interest;
      if (payment > maxPayment) {
        remainingExtra += payment - maxPayment;
        payment = maxPayment;
      }

      const principal = payment - interest;
      const newBalance = Math.max(0, balance - principal);

      // Track for schedule
      if (!schedules[index]) {
        schedules[index] = {
          accountId: debt.id,
          accountName: debt.name,
          payments: [],
          totalInterest: 0,
          payoffDate: '',
        };
      }

      const paymentDate = addMonths(startDate, month);

      schedules[index].payments.push({
        month,
        date: paymentDate.toISOString().split('T')[0],
        payment,
        principal,
        interest,
        balance: newBalance,
      });

      schedules[index].totalInterest += interest;
      totalInterest += interest;
      totalPaid += payment;

      currentBalances[index] = newBalance;

      if (newBalance === 0 && !schedules[index].payoffDate) {
        schedules[index].payoffDate = paymentDate.toISOString().split('T')[0];
      }
    });
  }

  const maxMonths = schedules.length > 0
    ? Math.max(...schedules.map((s) => s.payments.length))
    : 0;

  return {
    strategy,
    debts: schedules,
    totalMonths: maxMonths,
    totalInterest,
    totalPaid,
  };
}

/**
 * Compare savings between avalanche and snowball methods
 */
export function compareStrategies(
  liabilities: Account[],
  extraPayment: number
): {
  avalanche: DebtPayoffResult;
  snowball: DebtPayoffResult;
  interestSavings: number;
  timeSavings: number;
} {
  const avalanche = calculateAvalanche(liabilities, extraPayment);
  const snowball = calculateSnowball(liabilities, extraPayment);

  return {
    avalanche,
    snowball,
    interestSavings: snowball.totalInterest - avalanche.totalInterest,
    timeSavings: snowball.totalMonths - avalanche.totalMonths,
  };
}
