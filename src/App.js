import React, { useState, useEffect, useRef } from 'react';
import { Rocket, Trash2, Plus, DollarSign, TrendingDown, TrendingUp, Edit2, Save, X, Download, Volume2, VolumeX, PieChart as PieChartIcon, ChevronLeft, ChevronRight, Calendar, Repeat, Bell, BellOff, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import { saveMonthlyBudgets, loadMonthlyBudgets, migrateLocalStorageToFirestore } from './firestoreService';
import Insights from './Insights';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ThemeSelector from './components/ThemeSelector';

/**
 * Renders the animated starfield background
 * Defined outside main component to prevent recreation on every render
 */
const StarField = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full animate-pulse"
          style={{
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            animationDelay: Math.random() * 3 + 's',
            animationDuration: Math.random() * 3 + 2 + 's'
          }}
        />
      ))}
    </div>
  );
};

/**
 * Main Budget Calculator Component
 * A retro NES/space themed budget tracking application with Firestore persistence
 */
function MainApp() {
  const { user, logout } = useAuth();
  const { theme } = useTheme(); // Theme hook for dynamic colors

  // State Management
  const [monthlyBudgets, setMonthlyBudgets] = useState({});
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [newExpense, setNewExpense] = useState({
    name: '',
    amount: '',
    category: 'food',
    isRecurring: false
  });
  const [screen, setScreen] = useState('main');
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingExpenseData, setEditingExpenseData] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [alertsShown, setAlertsShown] = useState({});
  
  const populatedMonthsRef = useRef({});

  /**
   * Requests browser notification permission
   */
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      playClickSound();
    }
  };

  /**
   * Toggles notification permission
   */
  const toggleNotifications = () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      playClickSound();
    } else {
      requestNotificationPermission();
    }
  };

  /**
   * Gets the budget data for the current month
   */
  const getCurrentMonthData = () => {
    return monthlyBudgets[currentMonth] || { income: 0, incomeRecurring: false, expenses: [], categoryLimits: {} };
  };

  const getIncome = () => getCurrentMonthData().income;
  const getIncomeRecurring = () => getCurrentMonthData().incomeRecurring || false;
  const getExpenses = () => getCurrentMonthData().expenses || [];
  const getCategoryLimits = () => getCurrentMonthData().categoryLimits || {};

  /**
   * Sets a budget limit for a specific category
   */
  const setCategoryLimit = (categoryId, limit) => {
    const currentLimits = getCategoryLimits();
    const newLimits = { ...currentLimits };
    
    if (limit > 0) {
      newLimits[categoryId] = limit;
    } else {
      delete newLimits[categoryId];
    }
    
    setMonthlyBudgets(prev => ({
      ...prev,
      [currentMonth]: {
        ...getCurrentMonthData(),
        categoryLimits: newLimits
      }
    }));
  };

  /**
   * Updates income for the current month
   */
  const setIncome = (value, isRecurring) => {
    setMonthlyBudgets(prev => ({
      ...prev,
      [currentMonth]: {
        ...getCurrentMonthData(),
        income: value,
        incomeRecurring: isRecurring !== undefined ? isRecurring : getCurrentMonthData().incomeRecurring
      }
    }));
  };

  /**
   * Toggles whether income is recurring
   */
  const toggleIncomeRecurring = () => {
    const current = getIncomeRecurring();
    setIncome(getIncome(), !current);
    playClickSound();
  };

  /**
   * Updates expenses for the current month
   */
  const setExpenses = (newExpenses) => {
    setMonthlyBudgets(prev => ({
      ...prev,
      [currentMonth]: {
        ...getCurrentMonthData(),
        expenses: newExpenses
      }
    }));
  };

  /**
   * Load data from Firestore when component first mounts
   */
  useEffect(() => {
    const loadUserData = async () => {
      if (!user || !user.uid) return;
      
      try {
        await migrateLocalStorageToFirestore(user.uid);
        const data = await loadMonthlyBudgets(user.uid);
        
        if (data && Object.keys(data).length > 0) {
          setMonthlyBudgets(data);
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading user data:', error);
        setIsLoaded(true);
      }
    };
    
    loadUserData();
  }, [user]);

  /**
   * Save monthly budgets to Firestore whenever they change
   */
  useEffect(() => {
    const saveUserData = async () => {
      if (isLoaded && user && user.uid && Object.keys(monthlyBudgets).length > 0) {
        try {
          await saveMonthlyBudgets(user.uid, monthlyBudgets);
        } catch (error) {
          console.error('Error saving to Firestore:', error);
        }
      }
    };
    
    saveUserData();
  }, [monthlyBudgets, isLoaded, user]);

  /**
   * Auto-populate recurring items when changing months
   */
  useEffect(() => {
    if (!isLoaded || !currentMonth || populatedMonthsRef.current[currentMonth]) {
      return;
    }
    
    const timer = setTimeout(() => {
      const sortedMonths = Object.keys(monthlyBudgets).sort().reverse();
      const previousMonth = sortedMonths.find(m => m < currentMonth);
      
      if (!previousMonth) {
        populatedMonthsRef.current[currentMonth] = true;
        return;
      }
      
      const prevData = monthlyBudgets[previousMonth];
      if (!prevData) {
        populatedMonthsRef.current[currentMonth] = true;
        return;
      }
      
      const currentData = monthlyBudgets[currentMonth];
      const hasExpenses = currentData && currentData.expenses && currentData.expenses.length > 0;
      const hasIncome = currentData && currentData.income > 0;
      
      if (hasExpenses || hasIncome) {
        populatedMonthsRef.current[currentMonth] = true;
        return;
      }
      
      const newMonthData = {
        income: 0,
        incomeRecurring: false,
        expenses: [],
        categoryLimits: {}
      };
      
      let hasRecurringData = false;
      
      if (prevData.incomeRecurring && prevData.income > 0) {
        newMonthData.income = prevData.income;
        newMonthData.incomeRecurring = true;
        hasRecurringData = true;
      }
      
      if (prevData.expenses && Array.isArray(prevData.expenses) && prevData.expenses.length > 0) {
        const recurringExpenses = prevData.expenses
          .filter(exp => exp && exp.isRecurring)
          .map((exp, index) => ({
            ...exp,
            id: Date.now() + index
          }));
        
        if (recurringExpenses.length > 0) {
          newMonthData.expenses = recurringExpenses;
          hasRecurringData = true;
        }
      }
      
      if (prevData.categoryLimits && typeof prevData.categoryLimits === 'object') {
        newMonthData.categoryLimits = { ...prevData.categoryLimits };
      }
      
      if (hasRecurringData) {
        setMonthlyBudgets(prev => ({
          ...prev,
          [currentMonth]: newMonthData
        }));
        
        if (soundEnabled) {
          setTimeout(() => playSuccessSound(), 100);
        }
      }
      
      populatedMonthsRef.current[currentMonth] = true;
    }, 100);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, isLoaded]);

  // Available expense categories with associated colors
  const categories = [
    { id: 'food', name: '🍕 Food', color: '#ff6b9d' },
    { id: 'housing', name: '🏠 Housing', color: '#00e5ff' },
    { id: 'transport', name: '🚗 Transport', color: '#ffd700' },
    { id: 'entertainment', name: '🎮 Entertainment', color: '#00ff00' },
    { id: 'utilities', name: '⚡ Utilities', color: '#ff6b00' },
    { id: 'debt', name: '💳 Debt', color: '#ff4444' },
    { id: 'personal', name: '💆 Personal Care & Recreation', color: '#ff69b4' },
    { id: 'savings', name: '💰 Savings', color: '#ffd700' },
    { id: 'vacation', name: '✈️ Vacation Fund', color: '#00bfff' },
    { id: 'other', name: '📦 Other', color: '#c084fc' }
  ];

  /**
   * Sound Effect Generators using Web Audio API
   */
  const playClickSound = () => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const playSuccessSound = () => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const playWarningSound = () => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const playDeleteSound = () => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  /**
   * Calculation functions
   */
  const calculateTotalExpenses = () => {
    const expenses = getExpenses();
    return expenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);
  };

  const calculateRemaining = () => {
    return getIncome() - calculateTotalExpenses();
  };

  const calculateCategoryTotals = () => {
    const totals = {};
    const expenses = getExpenses();
    const income = getIncome();
    const limits = getCategoryLimits();
    
    categories.forEach(cat => {
      totals[cat.id] = 0;
    });
    
    expenses.forEach(expense => {
      totals[expense.category] += parseFloat(expense.amount);
    });
    
    return categories.map(cat => {
      const total = totals[cat.id];
      const limit = limits[cat.id] || 0;
      const percentOfLimit = limit > 0 ? (total / limit) * 100 : 0;
      
      return {
        ...cat,
        total: total,
        percentage: income > 0 ? (total / income) * 100 : 0,
        limit: limit,
        percentOfLimit: percentOfLimit,
        isOverLimit: limit > 0 && total > limit,
        isNearLimit: limit > 0 && total >= limit * 0.8 && total <= limit
      };
    }).filter(cat => cat.total > 0);
  };

  /**
   * Checks if any category limits have been exceeded
   */
  const checkCategoryLimits = () => {
    if (!notificationsEnabled) return;
    
    const categoryTotals = calculateCategoryTotals();
    const alertKey = currentMonth;
    
    categoryTotals.forEach(cat => {
      const notificationKey = `${alertKey}-${cat.id}`;
      
      if (cat.isOverLimit && !alertsShown[notificationKey]) {
        new Notification('⚠️ Budget Alert!', {
          body: `You've exceeded your ${cat.name} budget! Spent: ${formatCurrency(cat.total)} / Limit: ${formatCurrency(cat.limit)}`,
          icon: '🚀'
        });
        
        setAlertsShown(prev => ({
          ...prev,
          [notificationKey]: true
        }));
        
        playWarningSound();
      }
    });
  };

  /**
   * Expense management functions
   */
  const handleAddExpense = () => {
    if (newExpense.name && newExpense.amount) {
      const wasOverBudget = calculateRemaining() < 0;
      const expenses = getExpenses();
      
      setExpenses([
        ...expenses,
        {
          id: Date.now(),
          name: newExpense.name,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          isRecurring: newExpense.isRecurring
        }
      ]);
      
      const newRemaining = getIncome() - (calculateTotalExpenses() + parseFloat(newExpense.amount));
      if (newRemaining < 0 && !wasOverBudget) {
        playWarningSound();
      } else {
        playSuccessSound();
      }
      
      setNewExpense({ name: '', amount: '', category: 'food', isRecurring: false });
      setTimeout(() => checkCategoryLimits(), 100);
    }
  };

  const handleDeleteExpense = (id) => {
    const expenses = getExpenses();
    setExpenses(expenses.filter(expense => expense.id !== id));
    playDeleteSound();
  };

  const toggleExpenseRecurring = (id) => {
    const expenses = getExpenses();
    setExpenses(expenses.map(expense => 
      expense.id === id 
        ? { ...expense, isRecurring: !expense.isRecurring }
        : expense
    ));
    playClickSound();
  };

  const handleStartEdit = (expense) => {
    setEditingExpenseId(expense.id);
    setEditingExpenseData({ ...expense });
  };

  const handleSaveEdit = () => {
    if (editingExpenseData.name && editingExpenseData.amount) {
      const expenses = getExpenses();
      setExpenses(expenses.map(expense => 
        expense.id === editingExpenseId 
          ? { ...editingExpenseData, amount: parseFloat(editingExpenseData.amount) }
          : expense
      ));
      setEditingExpenseId(null);
      setEditingExpenseData(null);
      playSuccessSound();
    }
  };

  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setEditingExpenseData(null);
  };

  /**
   * Exports budget data to CSV file
   */
  const handleExportCSV = () => {
    const income = getIncome();
    const expenses = getExpenses();
    
    let csvContent = `Budget Report - ${formatMonthYear(currentMonth)}\n\n`;
    csvContent += "Category,Name,Amount\n";
    
    csvContent += `Income,Monthly Income,${income}\n`;
    
    expenses.forEach(expense => {
      const category = categories.find(c => c.id === expense.category);
      const name = expense.name.includes(',') ? `"${expense.name}"` : expense.name;
      csvContent += `${category.name},${name},${expense.amount}\n`;
    });
    
    csvContent += `\nSummary\n`;
    csvContent += `Total Income,,${income}\n`;
    csvContent += `Total Expenses,,${calculateTotalExpenses()}\n`;
    csvContent += `Remaining,,${calculateRemaining()}\n`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `space-budget-${currentMonth}-${date}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Month navigation
   */
  const handlePreviousMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2);
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
    playClickSound();
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const nextDate = new Date(year, month);
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
    playClickSound();
  };

  const formatMonthYear = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  /**
   * Gets historical data for month comparison chart
   */
  const getMonthlyHistory = () => {
    const months = Object.keys(monthlyBudgets).sort();
    return months.map(month => ({
      month: formatMonthYear(month).split(' ')[0],
      income: monthlyBudgets[month].income,
      expenses: monthlyBudgets[month].expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0),
      remaining: monthlyBudgets[month].income - monthlyBudgets[month].expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
    })).slice(-6);
  };

  const handleResetData = async () => {
    if (window.confirm('🚀 Are you sure you want to reset all data? This cannot be undone!')) {
      try {
        if (user && user.uid) {
          await saveMonthlyBudgets(user.uid, {});
        }
        localStorage.clear();
        window.location.reload();
      } catch (error) {
        console.error('Error resetting data:', error);
        alert('Error resetting data. Please try again.');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Main Render
  return (
    <div>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      <div 
        className="min-h-screen p-4 font-mono transition-all duration-300"
        style={{
          background: `linear-gradient(to bottom, ${theme.colors.primary}, ${theme.colors.secondary})`,
          color: theme.colors.text
        }}
      >
        <StarField />
        
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Control Buttons - Top Right */}
          <div className="fixed top-4 right-4 flex gap-2 z-50">
            <div 
              className="border-2 px-3 py-2 flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }}
            >
              <span className="text-xs font-bold" style={{ color: theme.colors.text }}>
                👤 {user?.email || user?.displayName || 'Player'}
              </span>
              <button
                onClick={logout}
                className="border-2 px-3 py-1 text-xs font-bold transition-all hover:scale-110"
                style={{
                  backgroundColor: theme.colors.error,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                LOGOUT
              </button>
            </div>
            
            <button
              onClick={toggleNotifications}
              className="border-2 p-2 transition-all hover:scale-110 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }}
              title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
            >
              {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
            </button>
            
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (soundEnabled) {
                  playClickSound();
                }
              }}
              className="border-2 p-2 transition-all hover:scale-110 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }}
              title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
          
          {/* Header */}
          <div className="text-center mb-8 mt-8">
            <div 
              className="inline-block border-4 p-6 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]"
              style={{
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.border
              }}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <Rocket size={32} className="animate-bounce" />
                <h1 className="text-4xl font-bold" style={{ color: theme.colors.text }}>SPACE BUDGET</h1>
                <Rocket size={32} className="animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>NES EDITION v1.0</p>
            </div>
          </div>

          {/* Month Navigation */}
          <div 
            className="border-4 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }}
          >
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousMonth}
                className="border-2 p-3 transition-all hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: theme.colors.accent,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
                title="Previous month"
              >
                <ChevronLeft size={24} />
              </button>
              
              <div className="flex items-center gap-3" style={{ color: theme.colors.text }}>
                <Calendar size={24} />
                <span className="text-2xl font-bold">{formatMonthYear(currentMonth)}</span>
              </div>
              
              <button
                onClick={handleNextMonth}
                className="border-2 p-3 transition-all hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: theme.colors.accent,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
                title="Next month"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                playClickSound();
                setScreen('main');
              }}
              className="flex-1 border-4 p-4 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: screen === 'main' ? theme.colors.accent : theme.colors.secondary,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }}
            >
              🎮 DASHBOARD
            </button>
            <button
              onClick={() => {
                playClickSound();
                setScreen('insights');
              }}
              className="flex-1 border-4 p-4 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: screen === 'insights' ? theme.colors.accent : theme.colors.secondary,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }}
            >
              📊 INSIGHTS
            </button>
            <button
              onClick={() => {
                playClickSound();
                setScreen('settings');
              }}
              className="flex-1 border-4 p-4 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: screen === 'settings' ? theme.colors.accent : theme.colors.secondary,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }}
            >
              ⚙️ MANAGE
            </button>
          </div>

          {/* Dashboard Screen */}
          {screen === 'main' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-in]">
              {/* Budget Overview Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className="border-4 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105"
                  style={{
                    backgroundColor: theme.colors.success,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={20} />
                    <span className="text-sm font-bold">INCOME</span>
                    {getIncomeRecurring() && <Repeat size={16} className="animate-pulse" title="Recurring" />}
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(getIncome())}</div>
                </div>

                <div 
                  className="border-4 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105"
                  style={{
                    backgroundColor: theme.colors.error,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={20} />
                    <span className="text-sm font-bold">EXPENSES</span>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(calculateTotalExpenses())}</div>
                </div>

                <div 
                  className={`border-4 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105 ${calculateRemaining() < 0 ? 'animate-pulse' : ''}`}
                  style={{
                    backgroundColor: calculateRemaining() < 0 ? theme.colors.error : theme.colors.accent,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={20} />
                    <span className="text-sm font-bold">REMAINING</span>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(calculateRemaining())}</div>
                  {calculateRemaining() < 0 && (
                    <div className="text-xs mt-1 animate-pulse">⚠️ OVER BUDGET!</div>
                  )}
                </div>
              </div>

              {/* Budget Alerts */}
              {(() => {
                const overLimitCategories = calculateCategoryTotals().filter(cat => cat.isOverLimit);
                const nearLimitCategories = calculateCategoryTotals().filter(cat => cat.isNearLimit);
                
                if (overLimitCategories.length > 0 || nearLimitCategories.length > 0) {
                  return (
                    <div 
                      className="border-4 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      style={{
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={20} style={{ color: theme.colors.warning }} className="animate-pulse" />
                        <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>⚠️ BUDGET ALERTS</h3>
                      </div>
                      
                      {overLimitCategories.length > 0 && (
                        <div className="mb-3">
                          <p className="font-bold text-sm mb-2" style={{ color: theme.colors.error }}>🚨 OVER BUDGET:</p>
                          {overLimitCategories.map(cat => (
                            <div 
                              key={cat.id} 
                              className="text-sm mb-1 p-2 border-l-4"
                              style={{
                                backgroundColor: `${theme.colors.error}20`,
                                borderColor: theme.colors.error,
                                color: theme.colors.text
                              }}
                            >
                              {cat.name}: {formatCurrency(cat.total)} / {formatCurrency(cat.limit)} 
                              <span style={{ color: theme.colors.error }} className="ml-2">({Math.round(cat.percentOfLimit)}%)</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {nearLimitCategories.length > 0 && (
                        <div>
                          <p className="font-bold text-sm mb-2" style={{ color: theme.colors.warning }}>⚡ WARNING (80%+):</p>
                          {nearLimitCategories.map(cat => (
                            <div 
                              key={cat.id} 
                              className="text-sm mb-1 p-2 border-l-4"
                              style={{
                                backgroundColor: `${theme.colors.warning}20`,
                                borderColor: theme.colors.warning,
                                color: theme.colors.text
                              }}
                            >
                              {cat.name}: {formatCurrency(cat.total)} / {formatCurrency(cat.limit)}
                              <span style={{ color: theme.colors.warning }} className="ml-2">({Math.round(cat.percentOfLimit)}%)</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Monthly Comparison Chart */}
              {Object.keys(monthlyBudgets).length > 1 && (
                <div 
                  className="border-4 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border
                  }}
                >
                  <h3 className="text-lg font-bold mb-4" style={{ color: theme.colors.text }}>📈 MONTHLY TRENDS</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={getMonthlyHistory()}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
                      <XAxis 
                        dataKey="month" 
                        stroke={theme.colors.text}
                        style={{ fontFamily: 'monospace', fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke={theme.colors.text}
                        style={{ fontFamily: 'monospace', fontSize: '12px' }}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme.colors.surface,
                          border: `2px solid ${theme.colors.border}`,
                          borderRadius: '0',
                          color: theme.colors.text,
                          fontFamily: 'monospace'
                        }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Legend 
                        wrapperStyle={{ 
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          color: theme.colors.text
                        }}
                      />
                      <Bar dataKey="income" fill={theme.colors.success} stroke="#000" strokeWidth={2} name="Income" />
                      <Bar dataKey="expenses" fill={theme.colors.error} stroke="#000" strokeWidth={2} name="Expenses" />
                      <Bar dataKey="remaining" fill={theme.colors.accent} stroke="#000" strokeWidth={2} name="Remaining" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Pie Chart Visualization */}
              {getExpenses().length > 0 && (
                <div 
                  className="border-4 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <PieChartIcon size={24} style={{ color: theme.colors.text }} />
                    <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>🥧 SPENDING BREAKDOWN</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={calculateCategoryTotals()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="total"
                        animationDuration={800}
                        animationBegin={0}
                      >
                        {calculateCategoryTotals().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme.colors.surface,
                          border: `2px solid ${theme.colors.border}`,
                          borderRadius: '0',
                          color: theme.colors.text,
                          fontFamily: 'monospace'
                        }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Legend 
                        wrapperStyle={{ 
                          fontFamily: 'monospace',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Category Breakdown */}
              {getExpenses().length > 0 && (
                <div 
                  className="border-4 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border
                  }}
                >
                  <h3 className="text-lg font-bold mb-4" style={{ color: theme.colors.text }}>📊 CATEGORY DETAILS</h3>
                  <div className="space-y-3">
                    {calculateCategoryTotals().map(cat => {
                      let barColor = cat.color;
                      if (cat.limit > 0) {
                        if (cat.isOverLimit) {
                          barColor = theme.colors.error;
                        } else if (cat.isNearLimit) {
                          barColor = theme.colors.warning;
                        }
                      }
                      
                      return (
                        <div key={cat.id}>
                          <div className="flex justify-between mb-1 text-sm items-center">
                            <div className="flex items-center gap-2">
                              <span style={{ color: theme.colors.text }}>{cat.name}</span>
                              {cat.isOverLimit && <AlertTriangle size={14} style={{ color: theme.colors.error }} className="animate-pulse" />}
                              {cat.isNearLimit && <AlertTriangle size={14} style={{ color: theme.colors.warning }} />}
                            </div>
                            <div className="text-right">
                              <span className="font-bold" style={{ color: theme.colors.text }}>{formatCurrency(cat.total)}</span>
                              {cat.limit > 0 && (
                                <span className="text-xs ml-2" style={{ color: theme.colors.textSecondary }}>
                                  / {formatCurrency(cat.limit)} ({Math.round(cat.percentOfLimit)}%)
                                </span>
                              )}
                            </div>
                          </div>
                          <div 
                            className="w-full h-6 border-2 relative"
                            style={{
                              backgroundColor: theme.colors.secondary,
                              borderColor: theme.colors.border
                            }}
                          >
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${Math.min(cat.percentage, 100)}%`,
                                backgroundColor: barColor
                              }}
                            />
                            {cat.limit > 0 && (
                              <div 
                                className="absolute top-0 bottom-0 w-1"
                                style={{ 
                                  left: `${Math.min((cat.limit / getIncome()) * 100, 100)}%`,
                                  backgroundColor: theme.colors.text,
                                  boxShadow: `0 0 4px ${theme.colors.text}`
                                }}
                                title={`Limit: ${formatCurrency(cat.limit)}`}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Expenses List */}
              {getExpenses().length > 0 && (
                <div 
                  className="border-4 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border
                  }}
                >
                  <h3 className="text-lg font-bold mb-2" style={{ color: theme.colors.text }}>📝 RECENT EXPENSES</h3>
                  <p className="text-xs mb-4" style={{ color: theme.colors.textSecondary }}>💡 Tip: Mark expenses as recurring (🔄) to auto-copy them to new months!</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {getExpenses().map(expense => {
                      const category = categories.find(c => c.id === expense.category);
                      const isEditing = editingExpenseId === expense.id;
                      
                      return (
                        <div
                          key={expense.id}
                          className="border-2 p-3 transition-colors"
                          style={{
                            backgroundColor: theme.colors.secondary,
                            borderColor: isEditing ? theme.colors.accent : theme.colors.border
                          }}
                        >
                          {isEditing ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editingExpenseData.name}
                                onChange={(e) => setEditingExpenseData({ ...editingExpenseData, name: e.target.value })}
                                placeholder="Expense name"
                                className="w-full border-2 p-2 font-bold outline-none"
                                style={{
                                  backgroundColor: theme.colors.surface,
                                  borderColor: theme.colors.border,
                                  color: theme.colors.text
                                }}
                              />
                              <input
                                type="number"
                                value={editingExpenseData.amount}
                                onChange={(e) => setEditingExpenseData({ ...editingExpenseData, amount: e.target.value })}
                                placeholder="Amount"
                                className="w-full border-2 p-2 font-bold outline-none"
                                style={{
                                  backgroundColor: theme.colors.surface,
                                  borderColor: theme.colors.border,
                                  color: theme.colors.text
                                }}
                              />
                              <select
                                value={editingExpenseData.category}
                                onChange={(e) => setEditingExpenseData({ ...editingExpenseData, category: e.target.value })}
                                className="w-full border-2 p-2 font-bold outline-none"
                                style={{
                                  backgroundColor: theme.colors.surface,
                                  borderColor: theme.colors.border,
                                  color: theme.colors.text
                                }}
                              >
                                {categories.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                              </select>
                              
                              <button
                                type="button"
                                onClick={() => setEditingExpenseData({ ...editingExpenseData, isRecurring: !editingExpenseData.isRecurring })}
                                className="w-full border-2 p-2 font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                                style={{
                                  backgroundColor: editingExpenseData.isRecurring ? theme.colors.success : theme.colors.secondary,
                                  borderColor: theme.colors.border,
                                  color: theme.colors.text
                                }}
                              >
                                {editingExpenseData.isRecurring ? <Repeat size={16} /> : <X size={16} />}
                                {editingExpenseData.isRecurring ? 'RECURRING ✓' : 'ONE-TIME'}
                              </button>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveEdit}
                                  className="flex-1 border-2 p-2 font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                                  style={{
                                    backgroundColor: theme.colors.success,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.text
                                  }}
                                >
                                  <Save size={16} />
                                  SAVE
                                </button>
                                <button
                                  onClick={() => {
                                    playClickSound();
                                    handleCancelEdit();
                                  }}
                                  className="flex-1 border-2 p-2 font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                                  style={{
                                    backgroundColor: theme.colors.secondary,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.text
                                  }}
                                >
                                  <X size={16} />
                                  CANCEL
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-3 h-3 border-2 border-black"
                                  style={{ backgroundColor: category.color }}
                                />
                                <div>
                                  <div className="font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                                    {expense.name}
                                    {expense.isRecurring && (
                                      <Repeat size={14} style={{ color: theme.colors.success }} title="Recurring expense" />
                                    )}
                                  </div>
                                  <div className="text-xs" style={{ color: theme.colors.textSecondary }}>{category.name}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold" style={{ color: theme.colors.text }}>{formatCurrency(expense.amount)}</span>
                                <button
                                  onClick={() => {
                                    playClickSound();
                                    toggleExpenseRecurring(expense.id);
                                  }}
                                  className="border-2 p-2 transition-all hover:scale-110 active:scale-95"
                                  style={{
                                    backgroundColor: expense.isRecurring ? theme.colors.success : theme.colors.secondary,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.text
                                  }}
                                  title={expense.isRecurring ? "Remove recurring" : "Mark as recurring"}
                                >
                                  {expense.isRecurring ? <Repeat size={16} /> : <X size={16} />}
                                </button>
                                <button
                                  onClick={() => {
                                    playClickSound();
                                    handleStartEdit(expense);
                                  }}
                                  className="border-2 p-2 transition-all hover:scale-110 active:scale-95"
                                  style={{
                                    backgroundColor: theme.colors.accent,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.text
                                  }}
                                  title="Edit expense"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="border-2 p-2 transition-all hover:scale-110 active:scale-95"
                                  style={{
                                    backgroundColor: theme.colors.error,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.text
                                  }}
                                  title="Delete expense"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {getExpenses().length === 0 && (
                <div 
                  className="text-center py-12 border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border
                  }}
                >
                  <Rocket size={48} className="mx-auto mb-4 animate-bounce" style={{ color: theme.colors.text }} />
                  <p className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>NO EXPENSES YET!</p>
                  <p className="mb-2" style={{ color: theme.colors.textSecondary }}>Add your income and start tracking expenses for {formatMonthYear(currentMonth)}</p>
                  {Object.keys(monthlyBudgets).length > 0 && (
                    <p className="text-xs mt-4" style={{ color: theme.colors.success }}>
                      💡 Recurring items from previous months will auto-copy when you add new data!
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Insights Screen */}
          {screen === 'insights' && (
            <div className="animate-[fadeIn_0.3s_ease-in]">
              <Insights 
                monthlyBudgets={monthlyBudgets}
                currentMonth={currentMonth}
                formatCurrency={formatCurrency}
                categories={categories}
              />
            </div>
          )}

          {/* Settings Screen */}
          {screen === 'settings' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-in]">
              <ThemeSelector />
              
              {/* Income Input Section */}
              <div 
                className="border-4 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }}
              >
                <h3 className="text-xl font-bold mb-4" style={{ color: theme.colors.text }}>💰 SET INCOME</h3>
                <div className="space-y-3">
                  <input
                    type="number"
                    value={getIncome()}
                    onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
                    placeholder="Enter your income"
                    className="w-full border-4 p-3 font-bold outline-none"
                    style={{
                      backgroundColor: theme.colors.secondary,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                  />
                  <button
                    onClick={toggleIncomeRecurring}
                    className="w-full border-4 p-3 font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: getIncomeRecurring() ? theme.colors.success : theme.colors.secondary,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                  >
                    {getIncomeRecurring() ? <Repeat size={20} /> : <X size={20} />}
                    {getIncomeRecurring() ? 'RECURRING INCOME ✓' : 'MARK AS RECURRING'}
                  </button>
                  {getIncomeRecurring() && (
                    <p className="text-xs" style={{ color: theme.colors.success }}>💚 This income will auto-copy to new months</p>
                  )}
                </div>
              </div>

              {/* Add Expense Section */}
              <div 
                className="border-4 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }}
              >
                <h3 className="text-xl font-bold mb-4" style={{ color: theme.colors.text }}>➕ ADD EXPENSE</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newExpense.name}
                    onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                    placeholder="Expense name"
                    className="w-full border-4 p-3 font-bold outline-none"
                    style={{
                      backgroundColor: theme.colors.secondary,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                  />
                  
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="Amount"
                    className="w-full border-4 p-3 font-bold outline-none"
                    style={{
                      backgroundColor: theme.colors.secondary,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                  />
                  
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full border-4 p-3 font-bold outline-none"
                    style={{
                      backgroundColor: theme.colors.secondary,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  
                  <button
                    type="button"
                    onClick={() => setNewExpense({ ...newExpense, isRecurring: !newExpense.isRecurring })}
                    className="w-full border-4 p-3 font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: newExpense.isRecurring ? theme.colors.success : theme.colors.secondary,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                  >
                    {newExpense.isRecurring ? <Repeat size={20} /> : <X size={20} />}
                    {newExpense.isRecurring ? 'RECURRING ✓' : 'ONE-TIME EXPENSE'}
                  </button>
                  
                  <button
                    onClick={handleAddExpense}
                    className="w-full border-4 p-3 font-bold flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: theme.colors.success,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                  >
                    <Plus size={20} />
                    ADD EXPENSE
                  </button>
                </div>
              </div>

              {/* Category Budget Limits */}
              <div 
                className="border-4 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={24} style={{ color: theme.colors.warning }} />
                  <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>⚠️ SET SPENDING LIMITS</h3>
                </div>
                <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
                  Set budget limits for each category. You'll get alerts at 80% and 100%.
                </p>
                <div className="space-y-3">
                  {categories.map(cat => {
                    const currentLimit = getCategoryLimits()[cat.id] || 0;
                    return (
                      <div key={cat.id} className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 border-2 border-black flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm flex-1" style={{ color: theme.colors.text }}>{cat.name}</span>
                        <input
                          type="number"
                          value={currentLimit || ''}
                          onChange={(e) => setCategoryLimit(cat.id, parseFloat(e.target.value) || 0)}
                          placeholder="No limit"
                          className="w-32 border-2 p-2 text-sm font-bold outline-none"
                          style={{
                            backgroundColor: theme.colors.secondary,
                            borderColor: theme.colors.border,
                            color: theme.colors.text
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                {notificationsEnabled ? (
                  <p className="text-xs mt-4" style={{ color: theme.colors.success }}>
                    ✅ Notifications enabled! You'll be alerted when you exceed limits.
                  </p>
                ) : (
                  <p className="text-xs mt-4" style={{ color: theme.colors.warning }}>
                    💡 Enable notifications (🔔 button above) to get browser alerts!
                  </p>
                )}
              </div>

              {/* Export Data Section */}
              <div 
                className="border-4 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }}
              >
                <h3 className="text-xl font-bold mb-4" style={{ color: theme.colors.text }}>📥 EXPORT DATA</h3>
                <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>Download your budget data as a CSV file for Excel or Google Sheets.</p>
                <button
                  onClick={() => {
                    playClickSound();
                    handleExportCSV();
                  }}
                  className="w-full border-4 p-3 font-bold flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: theme.colors.accent,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                >
                  <Download size={20} />
                  DOWNLOAD CSV
                </button>
              </div>

              {/* Reset Data Section */}
              <div 
                className="border-4 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }}
              >
                <h3 className="text-xl font-bold mb-4" style={{ color: theme.colors.text }}>⚠️ DANGER ZONE</h3>
                <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>Reset all data and start fresh. This action cannot be undone!</p>
                <button
                  onClick={() => {
                    playWarningSound();
                    handleResetData();
                  }}
                  className="w-full border-4 p-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: theme.colors.error,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                >
                  🗑️ RESET ALL DATA
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8 text-sm" style={{ color: theme.colors.textSecondary }}>
            <p>💾 DATA AUTO-SAVED • PRESS START TO CONTINUE YOUR FINANCIAL JOURNEY 🚀</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper component that handles auth
function AppWithAuth() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return <MainApp />;
}

// Main export with both providers
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppWithAuth />
      </ThemeProvider>
    </AuthProvider>
  );
}