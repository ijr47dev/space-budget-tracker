// src/components/Toast.js
import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
        return <Info size={20} />;
      default:
        return <CheckCircle size={20} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      case 'info':
        return theme.colors.accent;
      default:
        return theme.colors.success;
    }
  };

  return (
    <div
      className="fixed top-20 right-4 z-50 border-4 p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-slideIn min-w-[280px] max-w-md"
      style={{
        backgroundColor: getBackgroundColor(),
        borderColor: theme.colors.border
      }}
    >
      <div className="flex items-start gap-3">
        <div style={{ color: theme.colors.text }}>
          {getIcon()}
        </div>
        <p className="flex-1 text-sm font-bold" style={{ color: theme.colors.text }}>
          {message}
        </p>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:scale-110 transition-transform"
          style={{ color: theme.colors.text }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;