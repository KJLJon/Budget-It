import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CategoryForm } from './CategoryForm';
import { useCategoryStore } from '@/store/useCategoryStore';
import type { Category } from '@/types';

export function CategoryManagement() {
  const categories = useCategoryStore((state) => state.categories);
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);
  const deleteCategory = useCategoryStore((state) => state.deleteCategory);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDelete = async (category: Category) => {
    if (category.isSystem) {
      alert('Cannot delete system categories');
      return;
    }

    if (confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      await deleteCategory(category.id);
    }
  };

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const transferCategories = categories.filter((c) => c.type === 'transfer');

  const renderCategoryList = (categoryList: Category[], title: string) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        {title}
      </h3>
      <div className="space-y-2">
        {categoryList.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-sm italic">
            No custom categories yet
          </p>
        ) : (
          categoryList.map((category) => (
            <div
              key={category.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </p>
                  {category.isSystem && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      System category
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingCategory(category);
                    setIsFormOpen(true);
                  }}
                  disabled={category.isSystem}
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  title={category.isSystem ? 'Cannot edit system categories' : 'Edit'}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(category)}
                  disabled={category.isSystem}
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  title={category.isSystem ? 'Cannot delete system categories' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Manage Categories
          </h2>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingCategory(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          Organize your transactions by creating custom categories. System categories cannot be edited or deleted.
        </p>
      </div>

      {renderCategoryList(incomeCategories, 'Income Categories')}
      {renderCategoryList(expenseCategories, 'Expense Categories')}
      {renderCategoryList(transferCategories, 'Transfer Categories')}

      {isFormOpen && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsFormOpen(false);
            setEditingCategory(null);
          }}
          title={editingCategory ? 'Edit Category' : 'Add Category'}
        >
          <CategoryForm
            category={editingCategory || undefined}
            onClose={() => {
              setIsFormOpen(false);
              setEditingCategory(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
