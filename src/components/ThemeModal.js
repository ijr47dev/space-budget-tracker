// src/components/ThemeModal.js
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { X, Check, Moon, Sun, Zap} from 'lucide-react';

const ThemeModal = ({ isOpen, onClose }) => {
  const { theme, currentThemeId, themes, changeTheme } = useTheme();

  if (!isOpen) return null;

  const themeIcons = {
    nes: Zap,
    dark: Moon,
    cyberpunk: Zap,
    minimalist: Sun
  };

  const themeDescriptions = {
    nes: '🎮 Retro 8-bit gaming vibes',
    dark: '🌙 Modern dark mode',
    cyberpunk: '⚡ Neon-soaked future',
    minimalist: '✨ Clean and simple'
  };

  const handleThemeChange = async (themeId) => {
    await changeTheme(themeId);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto border-4 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
            🎨 THEME SETTINGS
          </h2>
          <button
            onClick={onClose}
            className="border-2 p-2 transition-all hover:scale-110"
            style={{
              backgroundColor: theme.colors.secondary,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Theme Display */}
        <div 
          className="border-2 p-4 mb-4"
          style={{
            backgroundColor: theme.colors.secondary,
            borderColor: theme.colors.border
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: theme.colors.textSecondary }}>
                ACTIVE THEME
              </p>
              <p className="text-lg font-bold" style={{ color: theme.colors.text }}>
                {theme.name}
              </p>
              <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                {themeDescriptions[currentThemeId]}
              </p>
            </div>
            <Check size={28} style={{ color: theme.colors.success }} />
          </div>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(themes).map(([themeId, themeData]) => {
            const isActive = currentThemeId === themeId;
            const Icon = themeIcons[themeId];
            
            return (
              <button
                key={themeId}
                onClick={() => handleThemeChange(themeId)}
                className={`
                  border-4 p-4 text-left transition-all duration-200
                  hover:scale-105 hover:shadow-lg
                  ${isActive ? 'ring-4' : ''}
                `}
                style={{
                  backgroundColor: themeData.colors.surface,
                  borderColor: isActive ? themeData.colors.accent : themeData.colors.border,
                  color: themeData.colors.text,
                  ringColor: isActive ? themeData.colors.accent : 'transparent'
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon size={20} style={{ color: themeData.colors.accent }} />
                    <span className="font-bold text-sm">{themeData.name}</span>
                  </div>
                  {isActive && (
                    <Check size={18} style={{ color: themeData.colors.success }} />
                  )}
                </div>
                
                {/* Theme Color Preview */}
                <div className="flex gap-1 mt-3">
                  <div 
                    className="w-6 h-6 border-2"
                    style={{ 
                      backgroundColor: themeData.colors.accent,
                      borderColor: themeData.colors.border
                    }}
                    title="Accent"
                  />
                  <div 
                    className="w-6 h-6 border-2"
                    style={{ 
                      backgroundColor: themeData.colors.success,
                      borderColor: themeData.colors.border
                    }}
                    title="Success"
                  />
                  <div 
                    className="w-6 h-6 border-2"
                    style={{ 
                      backgroundColor: themeData.colors.warning,
                      borderColor: themeData.colors.border
                    }}
                    title="Warning"
                  />
                  <div 
                    className="w-6 h-6 border-2"
                    style={{ 
                      backgroundColor: themeData.colors.error,
                      borderColor: themeData.colors.border
                    }}
                    title="Error"
                  />
                </div>
                
                <p className="text-xs mt-2" style={{ color: themeData.colors.textSecondary }}>
                  {themeDescriptions[themeId]}
                </p>
              </button>
            );
          })}
        </div>

        {/* Info Text */}
        <div 
          className="mt-4 p-3 border-2 text-sm"
          style={{
            backgroundColor: theme.colors.secondary,
            borderColor: theme.colors.border,
            color: theme.colors.textSecondary
          }}
        >
          💡 <span className="font-semibold">Tip:</span> Your theme preference is automatically saved and syncs across all your devices!
        </div>
      </div>
    </>
  );
};

export default ThemeModal;