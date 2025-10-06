// src/components/ThemeSelector.js
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Palette, Check, Moon, Sun, Zap, Minimize2 } from 'lucide-react';

const ThemeSelector = () => {
  const { theme, currentThemeId, themes, changeTheme } = useTheme();

  // Theme icon mapping
  const themeIcons = {
    nes: Zap,
    dark: Moon,
    cyberpunk: Zap,
    minimalist: Minimize2
  };

  // Theme descriptions
  const themeDescriptions = {
    nes: '🎮 Retro 8-bit gaming vibes',
    dark: '🌙 Modern dark mode',
    cyberpunk: '⚡ Neon-soaked future',
    minimalist: '✨ Clean and simple'
  };

  const handleThemeChange = async (themeId) => {
    await changeTheme(themeId);
    // Optional: Add a subtle sound effect or haptic feedback here
  };

  return (
    <div 
      className="border-4 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Palette size={24} style={{ color: theme.colors.accent }} />
          <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>
            🎨 THEME SETTINGS
          </h3>
        </div>
        
        {/* Quick Dark Mode Toggle */}
        <button
          onClick={() => handleThemeChange(currentThemeId === 'dark' ? 'nes' : 'dark')}
          className="p-2 border-2 transition-all duration-200 hover:scale-110"
          style={{
            backgroundColor: theme.colors.secondary,
            borderColor: theme.colors.border,
            color: theme.colors.text
          }}
          title={currentThemeId === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
        >
          {currentThemeId === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
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
  );
};

export default ThemeSelector;