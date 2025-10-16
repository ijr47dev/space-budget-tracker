// src/components/LoadingSpinner.js
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Rocket } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  const { theme } = useTheme();

  return (
    <div 
      className="border-4 p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }}
    >
      <Rocket 
        size={48} 
        className="mx-auto mb-4 animate-bounce" 
        style={{ color: theme.colors.accent }} 
      />
      <div className="loading-shimmer inline-block">
        <p 
          className="text-lg font-bold px-4 py-2" 
          style={{ color: theme.colors.text }}
        >
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;