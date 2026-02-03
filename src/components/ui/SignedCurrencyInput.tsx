import { InputHTMLAttributes, forwardRef, useId, useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';

interface SignedCurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  value: number;
  onChange: (value: number) => void;
}

// Format number with commas
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(num));
};

// Parse formatted string to number
const parseNumber = (str: string): number => {
  const cleaned = str.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const SignedCurrencyInput = forwardRef<HTMLInputElement, SignedCurrencyInputProps>(
  ({ label, error, className = '', id: providedId, value, onChange, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;

    const isPositive = value >= 0;
    const absoluteValue = Math.abs(value);

    // Track display value separately from actual value
    const [displayValue, setDisplayValue] = useState(formatNumber(absoluteValue));
    const [isFocused, setIsFocused] = useState(false);

    // Update display value when prop value changes (from external source)
    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatNumber(absoluteValue));
      }
    }, [absoluteValue, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      setDisplayValue(input);
      const numValue = parseNumber(input);
      onChange(isPositive ? numValue : -numValue);
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
      // Format on blur
      setDisplayValue(formatNumber(absoluteValue));
    };

    const toggleSign = () => {
      onChange(-value);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSign}
            className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
              isPositive
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
            }`}
            title={isPositive ? 'Click to make negative' : 'Click to make positive'}
          >
            {isPositive ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
          </button>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              $
            </span>
            <input
              ref={ref}
              id={id}
              type="text"
              inputMode="decimal"
              value={displayValue}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? errorId : undefined}
              className={`w-full pl-7 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                error ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''
              } ${className}`}
              {...props}
            />
          </div>
        </div>
        {error && (
          <p id={errorId} className="text-red-500 dark:text-red-400 text-sm mt-1" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

SignedCurrencyInput.displayName = 'SignedCurrencyInput';
