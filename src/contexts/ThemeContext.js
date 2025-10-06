// src/contexts/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Theme configurations
const THEMES = {
  nes: {
    id: 'nes',
    name: 'NES Classic',
    colors: {
      // Background colors
      primary: '#1a1a2e',      // Deep space blue
      secondary: '#16213e',    // Darker blue
      surface: '#0f3460',      // Card background
      
      // Text colors
      text: '#ffffff',
      textSecondary: '#e4e4e4',
      
      // Accent colors
      accent: '#e94560',       // Hot pink/red
      success: '#00d9ff',      // Cyan
      warning: '#ffd700',      // Gold
      error: '#ff4757',        // Bright red
      
      // UI elements
      border: '#2d3561',
      shadow: 'rgba(0, 0, 0, 0.5)',
      
      // Category colors (retro NES palette)
      categories: {
        housing: '#ff6b6b',
        food: '#4ecdc4',
        transport: '#45b7d1',
        entertainment: '#96ceb4',
        utilities: '#ffeaa7',
        healthcare: '#dfe6e9',
        shopping: '#fd79a8',
        savings: '#a29bfe',
        debt: '#ff7675',
        other: '#74b9ff'
      }
    }
  },
  
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    colors: {
      // Modern dark theme
      primary: '#0d1117',      // GitHub dark
      secondary: '#161b22',
      surface: '#1c2128',
      
      text: '#f0f6fc',
      textSecondary: '#8b949e',
      
      accent: '#58a6ff',       // Blue accent
      success: '#3fb950',      // Green
      warning: '#d29922',      // Orange
      error: '#f85149',        // Red
      
      border: '#30363d',
      shadow: 'rgba(0, 0, 0, 0.7)',
      
      categories: {
        housing: '#f85149',
        food: '#3fb950',
        transport: '#58a6ff',
        entertainment: '#bc8cff',
        utilities: '#d29922',
        healthcare: '#ff7b72',
        shopping: '#ffa657',
        savings: '#56d364',
        debt: '#da3633',
        other: '#79c0ff'
      }
    }
  },
  
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      // Neon cyberpunk aesthetic
      primary: '#0a0e27',      // Deep purple-black
      secondary: '#1a1d3a',
      surface: '#252747',
      
      text: '#ffffff',         // White text for better contrast
      textSecondary: '#c792ea',// Purple
      
      accent: '#ff2a6d',       // Hot pink
      success: '#05ffa1',      // Brighter green (better contrast than cyan)
      warning: '#fffc00',      // Yellow
      error: '#ff2a6d',
      
      border: '#ff2a6d',
      shadow: 'rgba(255, 42, 109, 0.3)',
      
      categories: {
        housing: '#ff2a6d',
        food: '#00fff9',
        transport: '#fffc00',
        entertainment: '#c792ea',
        utilities: '#ff9d00',
        healthcare: '#05ffa1',
        shopping: '#ff2a6d',
        savings: '#00fff9',
        debt: '#ff006e',
        other: '#c792ea'
      }
    }
  },
  
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist Light',
    colors: {
      // Clean, minimal light theme
      primary: '#ffffff',
      secondary: '#f8f9fa',
      surface: '#ffffff',
      
      text: '#212529',
      textSecondary: '#6c757d',
      
      accent: '#0066cc',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      
      border: '#dee2e6',
      shadow: 'rgba(0, 0, 0, 0.1)',
      
      categories: {
        housing: '#e74c3c',
        food: '#2ecc71',
        transport: '#3498db',
        entertainment: '#9b59b6',
        utilities: '#f39c12',
        healthcare: '#1abc9c',
        shopping: '#e91e63',
        savings: '#27ae60',
        debt: '#c0392b',
        other: '#95a5a6'
      }
    }
  }
};

// Create the context
const ThemeContext = createContext();

// Custom hook to use the theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Load from localStorage immediately on initialization
    const savedTheme = localStorage.getItem('themePreference');
    return (savedTheme && THEMES[savedTheme]) ? savedTheme : 'nes';
  });
  const [isLoading, setIsLoading] = useState(false);

  // Listen for auth state changes and try to sync with Firestore
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data().themePreference) {
            const savedTheme = userDoc.data().themePreference;
            if (THEMES[savedTheme]) {
              setCurrentTheme(savedTheme);
              localStorage.setItem('themePreference', savedTheme);
              console.log('Loaded theme from Firestore:', savedTheme);
            }
          }
        } catch (error) {
          console.log('Using localStorage for theme (Firestore unavailable)');
          // Silently fall back to localStorage
        }
      }
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Save theme preference to Firestore and localStorage
  const changeTheme = async (themeId) => {
    if (!THEMES[themeId]) {
      console.error('Invalid theme ID:', themeId);
      return;
    }

    setCurrentTheme(themeId);
    
    // Always save to localStorage first (instant persistence)
    localStorage.setItem('themePreference', themeId);

    const user = auth.currentUser;
    
    // Try to save to Firestore if user is authenticated
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          themePreference: themeId,
          updatedAt: new Date()
        }, { merge: true });
        
        console.log('Theme saved to Firestore:', themeId);
      } catch (error) {
        console.log('Theme saved to localStorage (Firestore sync disabled)');
        // Silently fail - localStorage is working
      }
    }
  };

  // Apply theme to CSS variables
  useEffect(() => {
    const theme = THEMES[currentTheme];
    const root = document.documentElement;

    // Apply all color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'object') {
        // Handle nested objects (like categories)
        Object.entries(value).forEach(([subKey, subValue]) => {
          root.style.setProperty(`--color-${key}-${subKey}`, subValue);
        });
      } else {
        root.style.setProperty(`--color-${key}`, value);
      }
    });

    // Apply body background
    document.body.style.backgroundColor = theme.colors.primary;
    document.body.style.color = theme.colors.text;
    
    // Smooth transition
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  }, [currentTheme]);

  const value = {
    theme: THEMES[currentTheme],
    currentThemeId: currentTheme,
    themes: THEMES,
    changeTheme,
    isLoading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;