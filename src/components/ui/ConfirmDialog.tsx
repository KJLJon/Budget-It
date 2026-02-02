import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
}: ConfirmDialogProps) {
  const colors = {
    danger: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400',
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${colors[variant]}`} />
          <p className="text-gray-700 dark:text-gray-300">{message}</p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {cancelLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
