import { ButtonHTMLAttributes, forwardRef, ElementType } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  as?: ElementType;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', as: Component = 'button', className = '', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors tap-highlight-transparent disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';

    const variants = {
      primary: 'bg-emerald-600 hover:bg-emerald-700 disabled:hover:bg-emerald-600 text-white',
      secondary: 'bg-gray-200 hover:bg-gray-300 disabled:hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:disabled:hover:bg-gray-700 text-gray-900 dark:text-white',
      danger: 'bg-red-600 hover:bg-red-700 disabled:hover:bg-red-600 text-white',
      ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 disabled:hover:bg-transparent text-gray-700 dark:text-gray-300',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <Component
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Button.displayName = 'Button';
