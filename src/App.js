import React, { useState, useEffect, useRef } from 'react';
import { Rocket, Trash2, Plus, DollarSign, TrendingDown, TrendingUp, Edit2, Save, X, Download, Volume2, VolumeX, PieChart as PieChartIcon, ChevronLeft, ChevronRight, Calendar, Repeat, Bell, BellOff, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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
 * A retro NES/space themed budget tracking application with localStorage persistence
 */
export default function NESBudgetCalculator() {
  // State Management
  const [monthlyBudgets, setMonthlyBudgets] = useState({}); // Stores budget data by month (key: "YYYY-MM")
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Initialize to current month in format "YYYY-MM"
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [newExpense, setNewExpense] = useState({ // Form state for adding new expenses
    name: '',
    amount: '',
    category: 'food',
    isRecurring: false
  });
  const [screen, setScreen] = useState('main'); // Controls which screen is displayed
  const [isLoaded, setIsLoaded] = useState(false); // Tracks if data has been loaded from localStorage
  const [editingExpenseId, setEditingExpenseId] = useState(null); // Tracks which expense is being edited
  const [editingExpenseData, setEditingExpenseData] = useState(null); // Holds the temporary edit data
  const [soundEnabled, setSoundEnabled] = useState(true); // Controls whether sound effects are enabled
  const [notificationsEnabled, setNotificationsEnabled] = useState(false); // Controls whether browser notifications are enabled
  const [alertsShown, setAlertsShown] = useState({}); // Tracks which category alerts have been shown this session (key: "month-category")
  
  // Ref to track which months have been auto-populated (to prevent duplicates)
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
   * @returns {object} Object with income, incomeRecurring, expenses, and categoryLimits for current month
   */
  const getCurrentMonthData = () => {
    return monthlyBudgets[currentMonth] || { income: 0, incomeRecurring: false, expenses: [], categoryLimits: {} };
  };

  /**
   * Gets income for the current month
   * @returns {number} Income value
   */
  const getIncome = () => getCurrentMonthData().income;

  /**
   * Gets whether income is recurring for the current month
   * @returns {boolean} True if income is recurring
   */
  const getIncomeRecurring = () => getCurrentMonthData().incomeRecurring || false;

  /**
   * Gets expenses for the current month
   * @returns {array} Array of expense objects
   */
  const getExpenses = () => getCurrentMonthData().expenses || [];

  /**
   * Gets category limits for the current month
   * @returns {object} Object with category IDs as keys and limit amounts as values
   */
  const getCategoryLimits = () => getCurrentMonthData().categoryLimits || {};

  /**
   * Sets a budget limit for a specific category
   * @param {string} categoryId - The category ID
   * @param {number} limit - The limit amount (0 to remove limit)
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
   * @param {number} value - New income value
   * @param {boolean} isRecurring - Optional: whether income is recurring
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
   * @param {array} newExpenses - New expenses array
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
   * useEffect Hook: Load data from localStorage when component first mounts
   * This runs once when the app starts, restoring any saved data
   * Also handles migration from old single-month format to new monthly format
   */
  useEffect(() => {
    // Check if there's new monthly format data
    const savedMonthlyBudgets = localStorage.getItem('monthlyBudgets');
    
    if (savedMonthlyBudgets) {
      // Load monthly budgets
      try {
        const parsed = JSON.parse(savedMonthlyBudgets);
        setMonthlyBudgets(parsed);
      } catch (error) {
        console.error('Error loading monthly budgets:', error);
      }
    } else {
      // Check for old format data and migrate it
      const savedIncome = localStorage.getItem('budgetIncome');
      const savedExpenses = localStorage.getItem('budgetExpenses');
      
      if (savedIncome || savedExpenses) {
        // Safely parse expenses
        let parsedExpenses = [];
        if (savedExpenses) {
          try {
            parsedExpenses = JSON.parse(savedExpenses);
            // Ensure each expense has isRecurring property
            parsedExpenses = parsedExpenses.map(exp => ({ 
              ...exp, 
              isRecurring: exp.isRecurring || false 
            }));
          } catch (error) {
            console.error('Error parsing expenses:', error);
            parsedExpenses = [];
          }
        }
        
        // Get current month from state
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        // Migrate old data to current month
        const migratedData = {
          [monthKey]: {
            income: savedIncome ? parseFloat(savedIncome) : 0,
            incomeRecurring: false,
            expenses: parsedExpenses,
            categoryLimits: {}
          }
        };
        setMonthlyBudgets(migratedData);
        
        // Clean up old localStorage keys
        localStorage.removeItem('budgetIncome');
        localStorage.removeItem('budgetExpenses');
      }
    }

    // Mark that we've finished loading
    setIsLoaded(true);
  }, []); // Empty array - only run once on mount

  /**
   * useEffect Hook: Save monthly budgets to localStorage whenever they change
   * The dependency array [monthlyBudgets] means this runs every time monthlyBudgets updates
   */
  useEffect(() => {
    // Only save after initial load to avoid overwriting with default value
    if (isLoaded) {
      localStorage.setItem('monthlyBudgets', JSON.stringify(monthlyBudgets));
    }
  }, [monthlyBudgets, isLoaded]); // Runs when monthlyBudgets or isLoaded changes

  /**
   * useEffect Hook: Auto-populate recurring items when changing months
   * This runs whenever currentMonth changes and checks if we need to populate
   */
  useEffect(() => {
    // Don't run if not loaded yet or if we've already populated this month
    if (!isLoaded || !currentMonth || populatedMonthsRef.current[currentMonth]) {
      return;
    }
    
    // Small delay to ensure state is settled
    const timer = setTimeout(() => {
      // Find the most recent previous month with data
      const sortedMonths = Object.keys(monthlyBudgets).sort().reverse();
      const previousMonth = sortedMonths.find(m => m < currentMonth);
      
      if (!previousMonth) {
        // Mark as checked even if no previous month
        populatedMonthsRef.current[currentMonth] = true;
        return;
      }
      
      const prevData = monthlyBudgets[previousMonth];
      if (!prevData) {
        populatedMonthsRef.current[currentMonth] = true;
        return;
      }
      
      // Check if this month already exists and has data
      const currentData = monthlyBudgets[currentMonth];
      
      const hasExpenses = currentData && currentData.expenses && currentData.expenses.length > 0;
      const hasIncome = currentData && currentData.income > 0;
      
      // Only populate if the month is empty
      if (hasExpenses || hasIncome) {
        populatedMonthsRef.current[currentMonth] = true;
        return;
      }
      
      // Build new month data
      const newMonthData = {
        income: 0,
        incomeRecurring: false,
        expenses: [],
        categoryLimits: {}
      };
      
      let hasRecurringData = false;
      
      // Copy recurring income
      if (prevData.incomeRecurring && prevData.income > 0) {
        newMonthData.income = prevData.income;
        newMonthData.incomeRecurring = true;
        hasRecurringData = true;
      }
      
      // Copy recurring expenses
      if (prevData.expenses && Array.isArray(prevData.expenses) && prevData.expenses.length > 0) {
        const recurringExpenses = prevData.expenses
          .filter(exp => exp && exp.isRecurring)
          .map((exp, index) => ({
            ...exp,
            id: Date.now() + index // Generate new unique ID
          }));
        
        if (recurringExpenses.length > 0) {
          newMonthData.expenses = recurringExpenses;
          hasRecurringData = true;
        }
      }
      
      // Copy category limits
      if (prevData.categoryLimits && typeof prevData.categoryLimits === 'object') {
        newMonthData.categoryLimits = { ...prevData.categoryLimits };
      }
      
      // Only update if we have recurring data to copy
      if (hasRecurringData) {
        setMonthlyBudgets(prev => ({
          ...prev,
          [currentMonth]: newMonthData
        }));
        
        // Play success sound
        if (soundEnabled) {
          setTimeout(() => playSuccessSound(), 100);
        }
      }
      
      // Mark this month as populated
      populatedMonthsRef.current[currentMonth] = true;
    }, 100);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, isLoaded]); // Only depend on currentMonth and isLoaded to avoid infinite loop

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
   * Sound Effect Generator using Web Audio API
   * Creates retro 8-bit style sounds without external files
   */
  
  /**
   * Plays a button click sound (short beep)
   */
  const playClickSound = () => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // High pitch beep
    oscillator.type = 'square'; // Retro square wave
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  /**
   * Plays a success sound (ascending notes)
   */
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

  /**
   * Plays a warning sound (descending notes)
   */
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

  /**
   * Plays a delete sound (low descending tone)
   */
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
   * Calculates the total of all expenses
   * @returns {number} Sum of all expense amounts
   */
  const calculateTotalExpenses = () => {
    const expenses = getExpenses();
    return expenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);
  };

  /**
   * Calculates remaining budget after expenses
   * @returns {number} Income minus total expenses
   */
  const calculateRemaining = () => {
    return getIncome() - calculateTotalExpenses();
  };

  /**
   * Calculates expenses by category for visualization
   * @returns {Array} Array of objects with category totals and limit information
   */
  const calculateCategoryTotals = () => {
    const totals = {};
    const expenses = getExpenses();
    const income = getIncome();
    const limits = getCategoryLimits();
    
    // Initialize all categories to 0
    categories.forEach(cat => {
      totals[cat.id] = 0;
    });
    
    // Sum up expenses by category
    expenses.forEach(expense => {
      totals[expense.category] += parseFloat(expense.amount);
    });
    
    // Convert to array format with category details
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
    }).filter(cat => cat.total > 0); // Only show categories with expenses
  };

  /**
   * Checks if any category limits have been exceeded and shows notifications
   */
  const checkCategoryLimits = () => {
    if (!notificationsEnabled) return;
    
    const categoryTotals = calculateCategoryTotals();
    const alertKey = currentMonth;
    
    categoryTotals.forEach(cat => {
      const notificationKey = `${alertKey}-${cat.id}`;
      
      // Only alert if we haven't already alerted for this category this month
      if (cat.isOverLimit && !alertsShown[notificationKey]) {
        // Show browser notification
        new Notification('⚠️ Budget Alert!', {
          body: `You've exceeded your ${cat.name} budget! Spent: ${formatCurrency(cat.total)} / Limit: ${formatCurrency(cat.limit)}`,
          icon: '🚀'
        });
        
        // Mark as shown
        setAlertsShown(prev => ({
          ...prev,
          [notificationKey]: true
        }));
        
        playWarningSound();
      }
    });
  };

  /**
   * Adds a new expense to the expenses array
   * Validates that name and amount are provided
   */
  const handleAddExpense = () => {
    if (newExpense.name && newExpense.amount) {
      const wasOverBudget = calculateRemaining() < 0;
      const expenses = getExpenses();
      
      setExpenses([
        ...expenses,
        {
          id: Date.now(), // Simple unique ID using timestamp
          name: newExpense.name,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          isRecurring: newExpense.isRecurring
        }
      ]);
      
      // Play sound after adding
      const newRemaining = getIncome() - (calculateTotalExpenses() + parseFloat(newExpense.amount));
      if (newRemaining < 0 && !wasOverBudget) {
        playWarningSound(); // Play warning if just went over budget
      } else {
        playSuccessSound(); // Play success sound
      }
      
      // Reset form after adding
      setNewExpense({ name: '', amount: '', category: 'food', isRecurring: false });
      
      // Check category limits after a short delay (to allow state to update)
      setTimeout(() => checkCategoryLimits(), 100);
    }
  };

  /**
   * Removes an expense from the expenses array
   * @param {number} id - The unique ID of the expense to delete
   */
  const handleDeleteExpense = (id) => {
    const expenses = getExpenses();
    setExpenses(expenses.filter(expense => expense.id !== id));
    playDeleteSound(); // Play delete sound
  };

  /**
   * Toggles the recurring status of an expense
   * @param {number} id - The unique ID of the expense to toggle
   */
  const toggleExpenseRecurring = (id) => {
    const expenses = getExpenses();
    setExpenses(expenses.map(expense => 
      expense.id === id 
        ? { ...expense, isRecurring: !expense.isRecurring }
        : expense
    ));
    playClickSound();
  };

  /**
   * Starts editing an expense
   * @param {object} expense - The expense object to edit
   */
  const handleStartEdit = (expense) => {
    setEditingExpenseId(expense.id);
    setEditingExpenseData({ ...expense });
  };

  /**
   * Saves the edited expense
   * Updates the expense in the expenses array with the new values
   */
  const handleSaveEdit = () => {
    if (editingExpenseData.name && editingExpenseData.amount) {
      const expenses = getExpenses();
      setExpenses(expenses.map(expense => 
        expense.id === editingExpenseId 
          ? { ...editingExpenseData, amount: parseFloat(editingExpenseData.amount) }
          : expense
      ));
      // Clear editing state
      setEditingExpenseId(null);
      setEditingExpenseData(null);
      playSuccessSound(); // Play success sound when saved
    }
  };

  /**
   * Cancels editing and discards changes
   */
  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setEditingExpenseData(null);
  };

  /**
   * Exports budget data to CSV file
   * Creates a downloadable CSV with income and all expenses
   */
  const handleExportCSV = () => {
    const income = getIncome();
    const expenses = getExpenses();
    
    // Create CSV header
    let csvContent = `Budget Report - ${formatMonthYear(currentMonth)}\n\n`;
    csvContent += "Category,Name,Amount\n";
    
    // Add income row
    csvContent += `Income,Monthly Income,${income}\n`;
    
    // Add all expenses
    expenses.forEach(expense => {
      const category = categories.find(c => c.id === expense.category);
      // Escape commas in names by wrapping in quotes
      const name = expense.name.includes(',') ? `"${expense.name}"` : expense.name;
      csvContent += `${category.name},${name},${expense.amount}\n`;
    });
    
    // Add summary rows
    csvContent += `\nSummary\n`;
    csvContent += `Total Income,,${income}\n`;
    csvContent += `Total Expenses,,${calculateTotalExpenses()}\n`;
    csvContent += `Remaining,,${calculateRemaining()}\n`;
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Set download filename with current date
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `space-budget-${currentMonth}-${date}.csv`);
    
    // Trigger download
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Navigates to the previous month
   */
  const handlePreviousMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2); // month - 2 because months are 0-indexed
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
    playClickSound();
  };

  /**
   * Navigates to the next month
   */
  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const nextDate = new Date(year, month); // month is already next month (0-indexed)
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
    playClickSound();
  };

  /**
   * Formats a month string (YYYY-MM) into readable format
   * @param {string} monthStr - Month string in format "YYYY-MM"
   * @returns {string} Formatted month like "October 2025"
   */
  const formatMonthYear = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  /**
   * Gets historical data for month comparison chart
   * @returns {array} Array of objects with month and spending data
   */
  const getMonthlyHistory = () => {
    const months = Object.keys(monthlyBudgets).sort();
    return months.map(month => ({
      month: formatMonthYear(month).split(' ')[0], // Just month name
      income: monthlyBudgets[month].income,
      expenses: monthlyBudgets[month].expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0),
      remaining: monthlyBudgets[month].income - monthlyBudgets[month].expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
    })).slice(-6); // Last 6 months
  };

  /**
   * Clears all data from localStorage and resets the app
   * Useful for starting fresh or testing
   */
  const handleResetData = () => {
    if (window.confirm('🚀 Are you sure you want to reset all data? This cannot be undone!')) {
      localStorage.removeItem('budgetIncome');
      localStorage.removeItem('budgetExpenses');
      localStorage.clear();

      window.location.reload(); // Reload to reset state  
      setIncome(0);
      setExpenses([]);
      setMonthlyBudgets({});
      
    }
  };

  /**
   * Formats a number as currency
   * @param {number} amount - The amount to format
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Main Render
  return (
    <>
      {/* Custom CSS Animations */}
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
      
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black text-white p-4 font-mono">
      <StarField />
      
      {/* Main Container */}
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Control Buttons - Top Right Corner */}
        <div className="fixed top-4 right-4 flex gap-2 z-50">
          {/* Notification Toggle Button */}
          <button
            onClick={toggleNotifications}
            className="bg-gray-800 hover:bg-gray-700 border-2 border-white p-2 transition-all hover:scale-110 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
            title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
          >
            {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
          </button>
          
          {/* Mute Button */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (soundEnabled) {
                playClickSound(); // Play one last sound before muting
              }
            }}
            className="bg-gray-800 hover:bg-gray-700 border-2 border-white p-2 transition-all hover:scale-110 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
            title={soundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
        
        {/* Header */}
        <div className="text-center mb-8 mt-8">
          <div className="inline-block bg-black border-4 border-white p-6 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Rocket size={32} className="animate-bounce" />
              <h1 className="text-4xl font-bold">SPACE BUDGET</h1>
              <Rocket size={32} className="animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <p className="text-sm text-gray-400">NES EDITION v1.0</p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="bg-gray-800 border-4 border-gray-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousMonth}
              className="bg-blue-600 hover:bg-blue-700 border-2 border-blue-800 p-3 transition-all hover:scale-110 active:scale-95"
              title="Previous month"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div className="flex items-center gap-3">
              <Calendar size={24} />
              <span className="text-2xl font-bold">{formatMonthYear(currentMonth)}</span>
            </div>
            
            <button
              onClick={handleNextMonth}
              className="bg-blue-600 hover:bg-blue-700 border-2 border-blue-800 p-3 transition-all hover:scale-110 active:scale-95"
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
            className={`flex-1 ${screen === 'main' ? 'bg-blue-600 border-blue-800' : 'bg-gray-700 border-gray-900'} border-4 p-4 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105 active:scale-95`}
          >
            🎮 DASHBOARD
          </button>
          <button
            onClick={() => {
              playClickSound();
              setScreen('settings');
            }}
            className={`flex-1 ${screen === 'settings' ? 'bg-blue-600 border-blue-800' : 'bg-gray-700 border-gray-900'} border-4 p-4 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105 active:scale-95`}
          >
            ⚙️ MANAGE
          </button>
        </div>

        {/* Dashboard Screen Content */}
        {screen === 'main' && (
          <div className="space-y-6 animate-[fadeIn_0.3s_ease-in]">{/* Budget Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Income Display */}
          <div className="bg-green-600 border-4 border-green-800 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} />
              <span className="text-sm font-bold">INCOME</span>
              {getIncomeRecurring() && <Repeat size={16} className="animate-pulse" title="Recurring" />}
            </div>
            <div className="text-2xl font-bold">{formatCurrency(getIncome())}</div>
          </div>

          {/* Total Expenses Display */}
          <div className="bg-red-600 border-4 border-red-800 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={20} />
              <span className="text-sm font-bold">EXPENSES</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(calculateTotalExpenses())}</div>
          </div>

          {/* Remaining Budget Display */}
          <div className={`${calculateRemaining() < 0 ? 'bg-red-600 border-red-800 animate-pulse' : 'bg-blue-600 border-blue-800'} border-4 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105`}>
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

        {/* Budget Alerts - Show warnings for over-limit categories */}
        {(() => {
          const overLimitCategories = calculateCategoryTotals().filter(cat => cat.isOverLimit);
          const nearLimitCategories = calculateCategoryTotals().filter(cat => cat.isNearLimit);
          
          if (overLimitCategories.length > 0 || nearLimitCategories.length > 0) {
            return (
              <div className="bg-gray-800 border-4 border-gray-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={20} className="text-yellow-400 animate-pulse" />
                  <h3 className="text-lg font-bold">⚠️ BUDGET ALERTS</h3>
                </div>
                
                {overLimitCategories.length > 0 && (
                  <div className="mb-3">
                    <p className="text-red-400 font-bold text-sm mb-2">🚨 OVER BUDGET:</p>
                    {overLimitCategories.map(cat => (
                      <div key={cat.id} className="text-sm mb-1 bg-red-900 bg-opacity-30 p-2 border-l-4 border-red-500">
                        {cat.name}: {formatCurrency(cat.total)} / {formatCurrency(cat.limit)} 
                        <span className="text-red-300 ml-2">({Math.round(cat.percentOfLimit)}%)</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {nearLimitCategories.length > 0 && (
                  <div>
                    <p className="text-yellow-400 font-bold text-sm mb-2">⚡ WARNING (80%+):</p>
                    {nearLimitCategories.map(cat => (
                      <div key={cat.id} className="text-sm mb-1 bg-yellow-900 bg-opacity-20 p-2 border-l-4 border-yellow-500">
                        {cat.name}: {formatCurrency(cat.total)} / {formatCurrency(cat.limit)}
                        <span className="text-yellow-300 ml-2">({Math.round(cat.percentOfLimit)}%)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return null;
        })()}

        {/* Monthly Comparison Chart - NEW! */}
        {Object.keys(monthlyBudgets).length > 1 && (
          <div className="bg-gray-800 border-4 border-gray-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-bold mb-4">📈 MONTHLY TRENDS</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getMonthlyHistory()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  dataKey="month" 
                  stroke="#fff" 
                  style={{ fontFamily: 'monospace', fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#fff" 
                  style={{ fontFamily: 'monospace', fontSize: '12px' }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '2px solid #000',
                    borderRadius: '0',
                    color: '#fff',
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
                <Bar dataKey="income" fill="#10b981" stroke="#000" strokeWidth={2} name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" stroke="#000" strokeWidth={2} name="Expenses" />
                <Bar dataKey="remaining" fill="#3b82f6" stroke="#000" strokeWidth={2} name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pie Chart Visualization - NEW! */}
        {getExpenses().length > 0 && (
          <div className="bg-gray-800 border-4 border-gray-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon size={24} />
              <h3 className="text-lg font-bold">🥧 SPENDING BREAKDOWN</h3>
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
                    backgroundColor: '#1f2937', 
                    border: '2px solid #000',
                    borderRadius: '0',
                    color: '#fff',
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

        {/* Category Breakdown - Original CSS Bars */}
        {getExpenses().length > 0 && (
          <div className="bg-gray-800 border-4 border-gray-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-bold mb-4">📊 CATEGORY DETAILS</h3>
            <div className="space-y-3">
              {calculateCategoryTotals().map(cat => {
                // Determine bar color based on limit status
                let barColor = cat.color;
                if (cat.limit > 0) {
                  if (cat.isOverLimit) {
                    barColor = '#ef4444'; // Red when over limit
                  } else if (cat.isNearLimit) {
                    barColor = '#fbbf24'; // Yellow when near limit (80%+)
                  }
                }
                
                return (
                  <div key={cat.id}>
                    <div className="flex justify-between mb-1 text-sm items-center">
                      <div className="flex items-center gap-2">
                        <span>{cat.name}</span>
                        {cat.isOverLimit && <AlertTriangle size={14} className="text-red-400 animate-pulse" />}
                        {cat.isNearLimit && <AlertTriangle size={14} className="text-yellow-400" />}
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{formatCurrency(cat.total)}</span>
                        {cat.limit > 0 && (
                          <span className="text-xs text-gray-400 ml-2">
                            / {formatCurrency(cat.limit)} ({Math.round(cat.percentOfLimit)}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-900 h-6 border-2 border-black relative">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${Math.min(cat.percentage, 100)}%`,
                          backgroundColor: barColor
                        }}
                      />
                      {/* Show limit marker if set */}
                      {cat.limit > 0 && (
                        <div 
                          className="absolute top-0 bottom-0 w-1 bg-white"
                          style={{ 
                            left: `${Math.min((cat.limit / getIncome()) * 100, 100)}%`,
                            boxShadow: '0 0 4px rgba(255,255,255,0.8)'
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
          <div className="bg-gray-800 border-4 border-gray-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-bold mb-2">📝 RECENT EXPENSES</h3>
            <p className="text-xs text-gray-400 mb-4">💡 Tip: Mark expenses as recurring (🔄) to auto-copy them to new months!</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getExpenses().map(expense => {
                const category = categories.find(c => c.id === expense.category);
                const isEditing = editingExpenseId === expense.id;
                
                return (
                  <div
                    key={expense.id}
                    className="bg-gray-900 border-2 border-gray-700 p-3 hover:border-white transition-colors"
                  >
                    {isEditing ? (
                      // Edit Mode - Show edit form
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingExpenseData.name}
                          onChange={(e) => setEditingExpenseData({ ...editingExpenseData, name: e.target.value })}
                          placeholder="Expense name"
                          className="w-full bg-gray-800 border-2 border-gray-600 p-2 text-white font-bold focus:border-white outline-none"
                        />
                        <input
                          type="number"
                          value={editingExpenseData.amount}
                          onChange={(e) => setEditingExpenseData({ ...editingExpenseData, amount: e.target.value })}
                          placeholder="Amount"
                          className="w-full bg-gray-800 border-2 border-gray-600 p-2 text-white font-bold focus:border-white outline-none"
                        />
                        <select
                          value={editingExpenseData.category}
                          onChange={(e) => setEditingExpenseData({ ...editingExpenseData, category: e.target.value })}
                          className="w-full bg-gray-800 border-2 border-gray-600 p-2 text-white font-bold focus:border-white outline-none"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        
                        {/* Recurring Toggle in Edit Mode */}
                        <button
                          type="button"
                          onClick={() => setEditingExpenseData({ ...editingExpenseData, isRecurring: !editingExpenseData.isRecurring })}
                          className={`w-full ${editingExpenseData.isRecurring ? 'bg-green-600 border-green-800' : 'bg-gray-600 border-gray-800'} hover:opacity-90 border-2 p-2 font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95`}
                        >
                          {editingExpenseData.isRecurring ? <Repeat size={16} /> : <X size={16} />}
                          {editingExpenseData.isRecurring ? 'RECURRING ✓' : 'ONE-TIME'}
                        </button>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              handleSaveEdit();
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 border-2 border-green-800 p-2 font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                          >
                            <Save size={16} />
                            SAVE
                          </button>
                          <button
                            onClick={() => {
                              playClickSound();
                              handleCancelEdit();
                            }}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 border-2 border-gray-800 p-2 font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                          >
                            <X size={16} />
                            CANCEL
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Normal Mode - Show expense details
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 border-2 border-black"
                            style={{ backgroundColor: category.color }}
                          />
                          <div>
                            <div className="font-bold flex items-center gap-2">
                              {expense.name}
                              {expense.isRecurring && (
                                <Repeat size={14} className="text-green-400" title="Recurring expense" />
                              )}
                            </div>
                            <div className="text-xs text-gray-400">{category.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{formatCurrency(expense.amount)}</span>
                          <button
                            onClick={() => {
                              playClickSound();
                              toggleExpenseRecurring(expense.id);
                            }}
                            className={`${expense.isRecurring ? 'bg-green-600 border-green-800' : 'bg-gray-600 border-gray-800'} hover:opacity-90 border-2 p-2 transition-all hover:scale-110 active:scale-95`}
                            title={expense.isRecurring ? "Remove recurring" : "Mark as recurring"}
                          >
                            {expense.isRecurring ? <Repeat size={16} /> : <X size={16} />}
                          </button>
                          <button
                            onClick={() => {
                              playClickSound();
                              handleStartEdit(expense);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 border-2 border-blue-800 p-2 transition-all hover:scale-110 active:scale-95"
                            title="Edit expense"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteExpense(expense.id);
                            }}
                            className="bg-red-600 hover:bg-red-700 border-2 border-red-800 p-2 transition-all hover:scale-110 active:scale-95"
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
          <div className="text-center py-12 bg-gray-800 border-4 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Rocket size={48} className="mx-auto mb-4 animate-bounce" />
            <p className="text-xl font-bold mb-2">NO EXPENSES YET!</p>
            <p className="text-gray-400 mb-2">Add your income and start tracking expenses for {formatMonthYear(currentMonth)}</p>
            {Object.keys(monthlyBudgets).length > 0 && (
              <p className="text-xs text-green-400 mt-4">
                💡 Recurring items from previous months will auto-copy when you add new data!
              </p>
            )}
          </div>
        )}</div>
        )}

        {/* Settings Screen Content */}
        {screen === 'settings' && (
          <div className="space-y-6 animate-[fadeIn_0.3s_ease-in]">{/* Income Input Section */}
        <div className="bg-gray-800 border-4 border-gray-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xl font-bold mb-4">💰 SET INCOME</h3>
          <div className="space-y-3">
            <input
              type="number"
              value={getIncome()}
              onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
              placeholder="Enter your income"
              className="w-full bg-gray-900 border-4 border-gray-700 p-3 text-white font-bold focus:border-white outline-none"
            />
            <button
              onClick={toggleIncomeRecurring}
              className={`w-full ${getIncomeRecurring() ? 'bg-green-600 border-green-800' : 'bg-gray-600 border-gray-800'} hover:opacity-90 border-4 p-3 font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95`}
            >
              {getIncomeRecurring() ? <Repeat size={20} /> : <X size={20} />}
              {getIncomeRecurring() ? 'RECURRING INCOME ✓' : 'MARK AS RECURRING'}
            </button>
            {getIncomeRecurring() && (
              <p className="text-xs text-green-400">💚 This income will auto-copy to new months</p>
            )}
          </div>
        </div>

        {/* Add Expense Section */}
        <div className="bg-gray-800 border-4 border-gray-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xl font-bold mb-4">➕ ADD EXPENSE</h3>
          <div className="space-y-4">
            {/* Expense Name Input */}
            <input
              type="text"
              value={newExpense.name}
              onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
              placeholder="Expense name"
              className="w-full bg-gray-900 border-4 border-gray-700 p-3 text-white font-bold focus:border-white outline-none"
            />
            
            {/* Expense Amount Input */}
            <input
              type="number"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              placeholder="Amount"
              className="w-full bg-gray-900 border-4 border-gray-700 p-3 text-white font-bold focus:border-white outline-none"
            />
            
            {/* Category Selection */}
            <select
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              className="w-full bg-gray-900 border-4 border-gray-700 p-3 text-white font-bold focus:border-white outline-none"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            {/* Recurring Toggle */}
            <button
              type="button"
              onClick={() => setNewExpense({ ...newExpense, isRecurring: !newExpense.isRecurring })}
              className={`w-full ${newExpense.isRecurring ? 'bg-green-600 border-green-800' : 'bg-gray-600 border-gray-800'} hover:opacity-90 border-4 p-3 font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95`}
            >
              {newExpense.isRecurring ? <Repeat size={20} /> : <X size={20} />}
              {newExpense.isRecurring ? 'RECURRING ✓' : 'ONE-TIME EXPENSE'}
            </button>
            
            {/* Add Button */}
            <button
              onClick={() => {
                handleAddExpense();
              }}
              className="w-full bg-green-600 hover:bg-green-700 border-4 border-green-800 p-3 font-bold flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={20} />
              ADD EXPENSE
            </button>
          </div>
        </div>

        {/* Category Budget Limits - NEW! */}
        <div className="bg-gray-800 border-4 border-gray-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={24} />
            <h3 className="text-xl font-bold">⚠️ SET SPENDING LIMITS</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
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
                  <span className="text-sm flex-1">{cat.name}</span>
                  <input
                    type="number"
                    value={currentLimit || ''}
                    onChange={(e) => setCategoryLimit(cat.id, parseFloat(e.target.value) || 0)}
                    placeholder="No limit"
                    className="w-32 bg-gray-900 border-2 border-gray-700 p-2 text-white text-sm font-bold focus:border-white outline-none"
                  />
                </div>
              );
            })}
          </div>
          {notificationsEnabled ? (
            <p className="text-xs text-green-400 mt-4">
              ✅ Notifications enabled! You'll be alerted when you exceed limits.
            </p>
          ) : (
            <p className="text-xs text-yellow-400 mt-4">
              💡 Enable notifications (🔔 button above) to get browser alerts!
            </p>
          )}
        </div>

        {/* Export Data Section */}
        <div className="bg-gray-800 border-4 border-gray-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xl font-bold mb-4">📥 EXPORT DATA</h3>
          <p className="text-gray-400 text-sm mb-4">Download your budget data as a CSV file for Excel or Google Sheets.</p>
          <button
            onClick={() => {
              playClickSound();
              handleExportCSV();
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 border-4 border-purple-800 p-3 font-bold flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105 active:scale-95"
          >
            <Download size={20} />
            DOWNLOAD CSV
          </button>
        </div>

        {/* Reset Data Section */}
        <div className="bg-gray-800 border-4 border-gray-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xl font-bold mb-4">⚠️ DANGER ZONE</h3>
          <p className="text-gray-400 text-sm mb-4">Reset all data and start fresh. This action cannot be undone!</p>
          <button
            onClick={() => {
              playWarningSound();
              handleResetData();
            }}
            className="w-full bg-red-600 hover:bg-red-700 border-4 border-red-800 p-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105 active:scale-95"
          >
            🗑️ RESET ALL DATA
          </button>
        </div></div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>💾 DATA AUTO-SAVED • PRESS START TO CONTINUE YOUR FINANCIAL JOURNEY 🚀</p>
        </div>
      </div>
    </div>
    </>
  );
}