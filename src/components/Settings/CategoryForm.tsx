import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCategoryStore } from '@/store/useCategoryStore';
import type { Category } from '@/types';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  type: z.enum(['income', 'expense', 'transfer']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  category?: Category;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
];

export function CategoryForm({ category, onClose }: CategoryFormProps) {
  const addCategory = useCategoryStore((state) => state.addCategory);
  const updateCategory = useCategoryStore((state) => state.updateCategory);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: category || {
      name: '',
      type: 'expense',
      color: PRESET_COLORS[0],
    },
  });

  const selectedColor = watch('color');

  const onSubmit = async (data: CategoryFormData) => {
    if (category) {
      await updateCategory(category.id, data);
    } else {
      await addCategory({
        ...data,
        isSystem: false,
      });
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Category Name"
        {...register('name')}
        error={errors.name?.message}
        placeholder="e.g., Groceries, Utilities"
      />

      <Select
        label="Category Type"
        {...register('type')}
        error={errors.type?.message}
      >
        <option value="income">Income</option>
        <option value="expense">Expense</option>
        <option value="transfer">Transfer</option>
      </Select>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Color
        </label>
        <div className="grid grid-cols-8 gap-2 mb-3">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={`w-8 h-8 rounded-full transition-all ${
                selectedColor === color
                  ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400 dark:ring-offset-gray-800 scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <Input
          type="text"
          {...register('color')}
          error={errors.color?.message}
          placeholder="#000000"
          className="font-mono"
        />
      </div>

      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div
          className="w-6 h-6 rounded-full flex-shrink-0"
          style={{ backgroundColor: selectedColor }}
        />
        <span className="text-gray-900 dark:text-white font-medium">
          {watch('name') || 'Category Name'}
        </span>
        <span className="ml-auto text-sm text-gray-600 dark:text-gray-400 capitalize">
          {watch('type')}
        </span>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="primary" className="flex-1">
          {category ? 'Update' : 'Add'} Category
        </Button>
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}
