// src/components/ConfirmDialog.js
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning' // warning, danger, info
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-[fadeIn_0.2s_ease-in]"
      onClick={onClose}
    >
      <div
        className="border-4 p-4 md:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full animate-popIn"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className="p-3 border-4 rounded-full"
            style={{
              backgroundColor: type === 'danger' ? theme.colors.error : theme.colors.warning,
              borderColor: theme.colors.border
            }}
          >
            <AlertTriangle size={32} style={{ color: theme.colors.text }} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-center mb-3" style={{ color: theme.colors.text }}>
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-center mb-6" style={{ color: theme.colors.textSecondary }}>
          {message}
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleConfirm}
            className="flex-1 border-2 px-4 py-3 font-bold transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: type === 'danger' ? theme.colors.error : theme.colors.warning,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border-2 px-4 py-3 font-bold transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: theme.colors.secondary,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;