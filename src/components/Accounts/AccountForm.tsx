import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Select } from '@/components/ui/Select';
import type { Account, AccountType } from '@/types';

const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.string(),
  category: z.enum(['asset', 'liability']),
  balance: z.number(),
  institution: z.string().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
  interestRate: z.number().optional(),
  originalAmount: z.number().optional(),
  originationDate: z.string().optional(),
  termMonths: z.number().optional(),
  minimumPayment: z.number().optional(),
  isRevolving: z.boolean().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AccountFormProps {
  account?: Account;
  onSubmit: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const assetTypes: { value: AccountType; label: string }[] = [
  { value: 'checking', label: 'Checking Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'investment', label: 'Investment Account' },
  { value: 'other_asset', label: 'Other Asset' },
];

const liabilityTypes: { value: AccountType; label: string }[] = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'loan', label: 'Personal Loan' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'other_liability', label: 'Other Liability' },
];

export function AccountForm({ account, onSubmit, onCancel }: AccountFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: account || {
      category: 'asset',
      type: 'checking',
      balance: 0,
    },
  });

  const category = watch('category');
  const accountTypes = category === 'asset' ? assetTypes : liabilityTypes;
  const isLiability = category === 'liability';

  const handleFormSubmit = (data: AccountFormData) => {
    onSubmit(data as Omit<Account, 'id' | 'createdAt' | 'updatedAt'>);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Select
        label="Account Category"
        options={[
          { value: 'asset', label: 'Asset' },
          { value: 'liability', label: 'Liability' },
        ]}
        error={errors.category?.message}
        {...register('category')}
      />

      <Select
        label="Account Type"
        options={accountTypes}
        error={errors.type?.message}
        {...register('type')}
      />

      <Input
        label="Account Name"
        placeholder="e.g., Chase Checking"
        error={errors.name?.message}
        {...register('name')}
      />

      <Controller
        name="balance"
        control={control}
        render={({ field }) => (
          <CurrencyInput
            label="Current Balance"
            value={field.value || 0}
            onChange={field.onChange}
            error={errors.balance?.message}
          />
        )}
      />

      <Input
        label="Institution (Optional)"
        placeholder="e.g., Chase Bank"
        error={errors.institution?.message}
        {...register('institution')}
      />

      <Input
        label="Color (Optional)"
        type="color"
        error={errors.color?.message}
        {...register('color')}
      />

      {isLiability && (
        <>
          <Input
            label="Interest Rate (APR %)"
            type="number"
            step="0.01"
            placeholder="e.g., 18.99"
            error={errors.interestRate?.message}
            {...register('interestRate', { valueAsNumber: true })}
          />

          <Controller
            name="originalAmount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                label="Original Amount"
                value={field.value || 0}
                onChange={field.onChange}
                error={errors.originalAmount?.message}
              />
            )}
          />

          <Input
            label="Origination Date"
            type="date"
            error={errors.originationDate?.message}
            {...register('originationDate')}
          />

          <Input
            label="Term (Months)"
            type="number"
            placeholder="e.g., 360 for 30 years"
            error={errors.termMonths?.message}
            {...register('termMonths', { valueAsNumber: true })}
          />

          <Controller
            name="minimumPayment"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                label="Minimum Payment"
                value={field.value || 0}
                onChange={field.onChange}
                error={errors.minimumPayment?.message}
              />
            )}
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRevolving"
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              {...register('isRevolving')}
            />
            <label
              htmlFor="isRevolving"
              className="ml-2 text-sm text-gray-700 dark:text-gray-300"
            >
              Revolving debt (e.g., credit card)
            </label>
          </div>
        </>
      )}

      <Input
        label="Notes (Optional)"
        placeholder="Additional notes..."
        error={errors.notes?.message}
        {...register('notes')}
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="primary" className="flex-1">
          {account ? 'Update' : 'Create'} Account
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
