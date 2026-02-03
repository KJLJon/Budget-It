import { useState, useEffect, useMemo } from 'react';
import { Calendar, DollarSign, Plus, Trash2, Edit2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useEscrowStore } from '@/store/useEscrowStore';
import { formatCurrency } from '@/utils/currency';
import type { EscrowItem, EscrowFrequency } from '@/types';
import { addDays, addMonths, format, parseISO } from 'date-fns';

interface EscrowFormData {
  name: string;
  amount: number;
  frequency: EscrowFrequency;
  nextDate: string;
  notes?: string;
}

const FREQUENCY_OPTIONS: { value: EscrowFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly (3 months)' },
  { value: 'semi-annual', label: 'Semi-Annual (6 months)' },
  { value: 'annual', label: 'Annual (Yearly)' },
];

export function Escrow() {
  const { escrowItems, fetchEscrowItems, addEscrowItem, updateEscrowItem, deleteEscrowItem } = useEscrowStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EscrowItem | null>(null);
  const [formData, setFormData] = useState<EscrowFormData>({
    name: '',
    amount: 0,
    frequency: 'monthly',
    nextDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Pay schedule for contribution calculator
  const [payFrequency, setPayFrequency] = useState<EscrowFrequency>('biweekly');
  const [nextPayDate, setNextPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDate, setTargetDate] = useState(
    addMonths(new Date(), 12).toISOString().split('T')[0]
  );

  useEffect(() => {
    fetchEscrowItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch once on mount

  // Calculate frequency in days
  const getFrequencyDays = (frequency: EscrowFrequency): number => {
    switch (frequency) {
      case 'weekly': return 7;
      case 'biweekly': return 14;
      case 'monthly': return 30.44; // Average month
      case 'quarterly': return 91.31; // 3 months average
      case 'semi-annual': return 182.62; // 6 months average
      case 'annual': return 365.25; // Account for leap years
      default: return 30.44;
    }
  };

  // Annual cost
  const annualCost = useMemo(() => {
    return escrowItems.reduce((total, item) => {
      const timesPerYear = 365.25 / getFrequencyDays(item.frequency);
      return total + (item.amount * timesPerYear);
    }, 0);
  }, [escrowItems]);

  // Calculate per-paycheck contribution (based on annual cost)
  const perPaycheckContribution = useMemo(() => {
    const payFreqDays = getFrequencyDays(payFrequency);
    const paychecksPerYear = 365.25 / payFreqDays;
    return annualCost / paychecksPerYear;
  }, [annualCost, payFrequency]);

  // Simulate cash flow to find minimum required balance
  const calculateRequiredBalance = useMemo(() => {
    if (escrowItems.length === 0) return 0;

    const startDate = parseISO(targetDate);
    const endDate = addMonths(startDate, 12);
    const payFreqDays = getFrequencyDays(payFrequency);

    // Generate all events (bills and transfers) over 12 months
    interface CashFlowEvent {
      date: Date;
      amount: number; // Positive for transfer in, negative for bill out
      description: string;
    }

    const events: CashFlowEvent[] = [];

    // Add all bill payments
    escrowItems.forEach(item => {
      let billDate = parseISO(item.nextDate);
      const itemFreqDays = getFrequencyDays(item.frequency);

      // Find first occurrence on or after start date
      while (billDate < startDate) {
        billDate = addDays(billDate, Math.round(itemFreqDays));
      }

      // Add all occurrences within 12 months
      while (billDate <= endDate) {
        events.push({
          date: billDate,
          amount: -item.amount,
          description: `${item.name} payment`,
        });
        billDate = addDays(billDate, Math.round(itemFreqDays));
      }
    });

    // Add all paycheck transfers
    let transferDate = parseISO(nextPayDate);
    // Find first transfer on or after start date
    while (transferDate < startDate) {
      transferDate = addDays(transferDate, Math.round(payFreqDays));
    }

    while (transferDate <= endDate) {
      events.push({
        date: transferDate,
        amount: perPaycheckContribution,
        description: 'Paycheck transfer',
      });
      transferDate = addDays(transferDate, Math.round(payFreqDays));
    }

    // Sort events by date
    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Simulate account balance starting at $0
    let balance = 0;
    let minBalance = 0;

    events.forEach(event => {
      balance += event.amount;
      if (balance < minBalance) {
        minBalance = balance;
      }
    });

    // Required starting balance is the absolute value of the minimum
    return Math.abs(minBalance);
  }, [escrowItems, targetDate, payFrequency, nextPayDate, perPaycheckContribution]);

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        await updateEscrowItem(editingItem.id, formData);
      } else {
        await addEscrowItem(formData);
      }
      setIsFormOpen(false);
      setEditingItem(null);
      setFormData({
        name: '',
        amount: 0,
        frequency: 'monthly',
        nextDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (error) {
      alert('Failed to save escrow item');
    }
  };

  const handleEdit = (item: EscrowItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      amount: item.amount,
      frequency: item.frequency,
      nextDate: item.nextDate,
      notes: item.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this escrow item?')) {
      await deleteEscrowItem(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">Escrow Account Calculator</p>
            <p className="text-blue-800 dark:text-blue-200">
              Simulates cash flow over 12 months to find the minimum balance needed so your account never goes negative when bills are paid.
              Set your pay schedule to see how much to transfer each paycheck.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Annual Cost</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(annualCost)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Required Balance</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(calculateRequiredBalance)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            minimum to avoid going negative
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Per Paycheck</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(perPaycheckContribution)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {payFrequency} transfers
          </p>
        </div>
      </div>

      {/* Contribution Calculator */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Pay Schedule
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pay Frequency
            </label>
            <Select
              value={payFrequency}
              onChange={(e) => setPayFrequency(e.target.value as EscrowFrequency)}
            >
              {FREQUENCY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Next Pay Date
            </label>
            <Input
              type="date"
              value={nextPayDate}
              onChange={(e) => setNextPayDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
          <p className="text-sm text-emerald-900 dark:text-emerald-100 mb-2">
            <strong>Transfer {formatCurrency(perPaycheckContribution)} per {payFrequency} paycheck</strong>
          </p>
          <p className="text-xs text-emerald-800 dark:text-emerald-200">
            Starting with {formatCurrency(calculateRequiredBalance)} in your account on {format(parseISO(targetDate), 'MMM d, yyyy')},
            this transfer amount keeps your balance positive as bills are paid over the next 12 months.
          </p>
        </div>
      </div>

      {/* Escrow Items List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Escrow Items ({escrowItems.length})
          </h3>
          <Button variant="primary" size="sm" onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {escrowItems.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No escrow items yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              Add recurring expenses like property tax, insurance premiums, or HOA fees
            </p>
            <Button variant="secondary" onClick={() => setIsFormOpen(true)}>
              Add First Item
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {escrowItems.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{formatCurrency(item.amount)} {item.frequency}</span>
                    <span>Next: {format(parseISO(item.nextDate), 'MMM d, yyyy')}</span>
                    {item.notes && <span className="text-xs italic">"{item.notes}"</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isFormOpen && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsFormOpen(false);
            setEditingItem(null);
          }}
          title={editingItem ? 'Edit Escrow Item' : 'Add Escrow Item'}
        >
          <div className="space-y-4">
            <Input
              id="escrow-name"
              label="Item Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Property Tax, Home Insurance"
            />

            <CurrencyInput
              id="escrow-amount"
              label="Amount *"
              value={formData.amount}
              onChange={(val) => setFormData({ ...formData, amount: val })}
            />

            <Select
              id="escrow-frequency"
              label="Frequency *"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as EscrowFrequency })}
            >
              {FREQUENCY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>

            <Input
              id="escrow-date"
              label="Next Due Date *"
              type="date"
              value={formData.nextDate}
              onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
            />

            <Input
              id="escrow-notes"
              label="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details..."
            />

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                onClick={handleSubmit}
                className="flex-1"
                disabled={!formData.name || formData.amount <= 0}
              >
                {editingItem ? 'Update' : 'Add'} Item
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingItem(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
