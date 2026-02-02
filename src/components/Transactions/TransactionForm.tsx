import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useAccountStore } from '@/store/useAccountStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import type { Transaction } from '@/types';
import { useEffect } from 'react';

const transactionSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  transaction?: Transaction;
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function TransactionForm({ transaction, onSubmit, onCancel }: TransactionFormProps) {
  const accounts = useAccountStore((state) => state.accounts);
  const categories = useCategoryStore((state) => state.categories);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction
      ? {
          date: transaction.date.split('T')[0],
          description: transaction.description,
          amount: Math.abs(transaction.amount),
          accountId: transaction.accountId,
          categoryId: transaction.categoryId,
          notes: transaction.notes,
        }
      : {
          date: new Date().toISOString().split('T')[0],
        },
  });

  // Register amount as number
  useEffect(() => {
    register('amount', { valueAsNumber: true });
  }, [register]);

  const onFormSubmit = (data: TransactionFormData) => {
    // Determine if expense or income based on category
    const category = categories.find((c) => c.id === data.categoryId);
    const isExpense = category?.type === 'expense';

    onSubmit({
      ...data,
      amount: isExpense ? -Math.abs(data.amount) : Math.abs(data.amount),
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <Input
        label="Date"
        type="date"
        {...register('date')}
        error={errors.date?.message}
      />

      <Select
        label="Account"
        {...register('accountId')}
        error={errors.accountId?.message}
      >
        <option value="">Select account</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </Select>

      <Input
        label="Description"
        {...register('description')}
        error={errors.description?.message}
        placeholder="e.g., Grocery Store, Salary"
      />

      <Input
        label="Amount"
        type="number"
        step="0.01"
        {...register('amount', { valueAsNumber: true })}
        error={errors.amount?.message}
        placeholder="0.00"
      />

      <Select
        label="Category (optional)"
        {...register('categoryId')}
        error={errors.categoryId?.message}
      >
        <option value="">Uncategorized</option>
        <optgroup label="Income">
          {categories
            .filter((c) => c.type === 'income')
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </optgroup>
        <optgroup label="Expenses">
          {categories
            .filter((c) => c.type === 'expense')
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </optgroup>
        <optgroup label="Transfers">
          {categories
            .filter((c) => c.type === 'transfer')
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </optgroup>
      </Select>

      <Input
        label="Notes (optional)"
        {...register('notes')}
        error={errors.notes?.message}
        placeholder="Additional details"
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="primary" className="flex-1">
          {transaction ? 'Update' : 'Add'} Transaction
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}
