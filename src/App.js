import React, { useState, useEffect, useCallback } from 'react';
import { Rocket, Trash2, Plus, DollarSign, TrendingDown, TrendingUp, Edit2, Save, X, Download, Volume2, VolumeX, PieChart as PieChartIcon, ChevronLeft, ChevronRight, Calendar, Repeat, Bell, BellOff, AlertTriangle, Palette } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import { saveMonthlyBudgets, loadMonthlyBudgets, migrateLocalStorageToFirestore } from './firestoreService';
import Insights from './Insights';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import BillsDueAlert from './components/BillsDueAlert';
import CalendarView from './components/CalendarView';
import ThemeModal from './components/ThemeModal';
import SavingsGoals from './components/SavingsGoals';

/**
 * StarField Component - Animated background stars
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
 * MainApp Component - Main budget tracking application
 */
function MainApp() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  // ===== STATE MANAGEMENT =====
  const [monthlyBudgets, setMonthlyBudgets] = useState({});
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [newExpense, setNewExpense] = useState({
    name: '',
    amount: '',
    category: 'food',
    isRecurring: false,
    dueDate: '',
    paid: false
  });
  const [screen, setScreen] = useState('main');
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingExpenseData, setEditingExpenseData] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [alertsShown, setAlertsShown] = useState({});
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState([]);
const [viewMode, setViewMode] = useState('dashboard');
  

  // ===== MONTH DATA GETTERS (MEMOIZED) =====
  
  /**
   * Get current month's budget data
   */
  const getCurrentMonthData = useCallback(() => {
    return monthlyBudgets[currentMonth] || { 
      income: 0, 
      incomeRecurring: false, 
      expenses: [], 
      categoryLimits: {} 
    };
  }, [monthlyBudgets, currentMonth]);

  const getIncome = useCallback(() => getCurrentMonthData().income, [getCurrentMonthData]);
  const getIncomeRecurring = useCallback(() => getCurrentMonthData().incomeRecurring || false, [getCurrentMonthData]);
  const getExpenses = useCallback(() => getCurrentMonthData().expenses || [], [getCurrentMonthData]);
  const getCategoryLimits = useCallback(() => getCurrentMonthData().categoryLimits || {}, [getCurrentMonthData]);

  // ===== DATE HELPER FUNCTIONS =====
  
  /**
   * Format date string for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  /**
   * Check if bill is due soon (within 3 days)
   */
  const isDueSoon = (dateString) => {
    if (!dateString) return false;
    const [year, month, day] = dateString.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
    return dueDate >= today && dueDate <= threeDaysFromNow;
  };

  /**
   * Check if bill is overdue
   */
  const isOverdue = (dateString) => {
    if (!dateString) return false;
    const [year, month, day] = dateString.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  /**
   * Get bills due this week (excluding paid bills)
   */
  const getBillsDueThisWeek = useCallback(() => {
    const expenses = getExpenses();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneWeekFromNow = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    return expenses.filter(expense => {
      if (!expense.dueDate || expense.paid) return false;
      const [year, month, day] = expense.dueDate.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && dueDate <= oneWeekFromNow;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [getExpenses]);

  /**
   * Get overdue bills (excluding paid bills)
   */
  const getOverdueBills = useCallback(() => {
    const expenses = getExpenses();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return expenses.filter(expense => {
      if (!expense.dueDate || expense.paid) return false;
      const [year, month, day] = expense.dueDate.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [getExpenses]);

  // ===== NOTIFICATION HANDLERS =====
  
  /**
   * Request browser notification permission
   */
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      playClickSound();
    }
  };

  /**
   * Toggle notification setting
   */
  const toggleNotifications = () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      playClickSound();
    } else {
      requestNotificationPermission();
    }
  };

  // ===== BUDGET DATA SETTERS =====
  
  /**
   * Set category spending limit
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
   * Set monthly income
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
   * Toggle income recurring status
   */
  const toggleIncomeRecurring = () => {
    const current = getIncomeRecurring();
    setIncome(getIncome(), !current);
    playClickSound();
  };

  /**
   * Set expenses for current month
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

  // ===== FIRESTORE DATA PERSISTENCE =====
  
  /**
   * Load user data from Firestore on mount
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

         if (data && data.savingsGoals) {
          setSavingsGoals(data.savingsGoals);
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
   * Save to Firestore when data changes
   */
  useEffect(() => {
    const saveUserData = async () => {
      if (isLoaded && user && user.uid && Object.keys(monthlyBudgets).length > 0) {
        try {
          await saveMonthlyBudgets(user.uid, {...monthlyBudgets, savingsGoals: savingsGoals });
        } catch (error) {
          console.error('Error saving to Firestore:', error);
        }
      }
    };
    
    saveUserData();
  }, [monthlyBudgets, savingsGoals, isLoaded, user]);

  // ===== AUTO-POPULATE RECURRING ITEMS =====
  
  /**
   * Auto-populate recurring items when switching months
   * Updates existing items with wrong due dates and adds missing items
   */
  useEffect(() => {
    if (!isLoaded || !currentMonth) {
      return;
    }
    
    const timer = setTimeout(() => {
      const sortedMonths = Object.keys(monthlyBudgets).sort().reverse();
      const previousMonth = sortedMonths.find(m => m < currentMonth);
      
      if (!previousMonth) {
        return;
      }
      
      const prevData = monthlyBudgets[previousMonth];
      if (!prevData) {
        return;
      }
      
      const currentData = monthlyBudgets[currentMonth] || { 
        income: 0, 
        incomeRecurring: false, 
        expenses: [], 
        categoryLimits: {} 
      };
      
      const recurringFromPrev = (prevData.expenses || []).filter(exp => exp && exp.isRecurring);
      
      if (recurringFromPrev.length === 0) {
        return;
      }
      
      // Create a map of existing expenses by normalized name
      const existingExpensesMap = new Map();
      (currentData.expenses || []).forEach(exp => {
        if (exp && exp.isRecurring) {
          existingExpensesMap.set(exp.name.trim().toLowerCase(), exp);
        }
      });
      
      const itemsToAdd = [];
      const itemsToUpdate = [];
      
      // Check each recurring item from previous month
      recurringFromPrev.forEach(prevExp => {
        const normalizedName = prevExp.name.trim().toLowerCase();
        const existingExp = existingExpensesMap.get(normalizedName);
        
        // Calculate adjusted due date for current month
        let adjustedDueDate = prevExp.dueDate;
        if (prevExp.dueDate) {
          const oldDay = parseInt(prevExp.dueDate.split('-')[2], 10);
          const [newYear, newMonth] = currentMonth.split('-').map(Number);
          const lastDayOfNewMonth = new Date(newYear, newMonth, 0).getDate();
          const dayToUse = Math.min(oldDay, lastDayOfNewMonth);
          adjustedDueDate = `${newYear}-${String(newMonth).padStart(2, '0')}-${String(dayToUse).padStart(2, '0')}`;
        }
        
        if (existingExp) {
          // Item exists - check if due date needs updating
          if (existingExp.dueDate !== adjustedDueDate) {
            itemsToUpdate.push({
              ...existingExp,
              dueDate: adjustedDueDate,
              paid: false // Reset paid status for new month
            });
          }
        } else {
          // Item doesn't exist - add it
          itemsToAdd.push({
            ...prevExp,
            id: Date.now() + Math.random() * 1000,
            dueDate: adjustedDueDate,
            paid: false // New recurring items start unpaid
          });
        }
      });
      
      if (itemsToAdd.length === 0 && itemsToUpdate.length === 0 && 
          !(prevData.incomeRecurring && prevData.income > 0 && currentData.income === 0)) {
        return;
      }
      
      // Build updated expenses list
      const updatedExpenses = (currentData.expenses || []).map(exp => {
        if (!exp || !exp.isRecurring) return exp;
        
        // Check if this expense needs updating
        const updateItem = itemsToUpdate.find(u => u.id === exp.id);
        return updateItem || exp;
      });
      
      // Add new items
      updatedExpenses.push(...itemsToAdd);
      
      // Update income if needed
      let updatedIncome = currentData.income;
      let updatedIncomeRecurring = currentData.incomeRecurring;
      
      if (prevData.incomeRecurring && prevData.income > 0 && currentData.income === 0) {
        updatedIncome = prevData.income;
        updatedIncomeRecurring = true;
      }
      
      // Copy category limits
      const updatedLimits = {
        ...(prevData.categoryLimits || {}),
        ...(currentData.categoryLimits || {})
      };
      
      // Update the month data
      setMonthlyBudgets(prev => ({
        ...prev,
        [currentMonth]: {
          income: updatedIncome,
          incomeRecurring: updatedIncomeRecurring,
          expenses: updatedExpenses,
          categoryLimits: updatedLimits
        }
      }));
      
      if (itemsToAdd.length > 0 || itemsToUpdate.length > 0) {
        if (soundEnabled) {
          setTimeout(() => playSuccessSound(), 100);
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, isLoaded, monthlyBudgets]);

  /**
   * Check for bills on load and send notifications
   */
  useEffect(() => {
    if (!notificationsEnabled || !isLoaded) return;
    
    const sessionKey = `bills-checked-${currentMonth}`;
    if (sessionStorage.getItem(sessionKey)) return;
    
    const billsDue = getBillsDueThisWeek();
    const overdue = getOverdueBills();
    
    if (overdue.length > 0) {
      new Notification('🚨 Overdue Bills!', {
        body: `You have ${overdue.length} overdue bill(s). Check your dashboard.`,
        icon: '🚀'
      });
    } else if (billsDue.length > 0) {
      new Notification('📅 Bills Due This Week', {
        body: `You have ${billsDue.length} bill(s) due this week.`,
        icon: '🚀'
      });
    }
    
    sessionStorage.setItem(sessionKey, 'true');
  }, [notificationsEnabled, isLoaded, currentMonth, getBillsDueThisWeek, getOverdueBills]);

  // ===== CATEGORY DEFINITIONS =====
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

  // ===== SOUND EFFECTS (WEB AUDIO API) =====
  
  /**
   * Play click sound effect
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

  /**
   * Play success sound effect
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
   * Play warning sound effect
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
   * Play delete sound effect
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

  // ===== CALCULATION FUNCTIONS =====
  
  /**
   * Calculate total expenses for current month
   */
  const calculateTotalExpenses = () => {
    const expenses = getExpenses();
    return expenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);
  };

  /**
   * Calculate remaining budget
   */
  const calculateRemaining = () => {
    return getIncome() - calculateTotalExpenses();
  };

  /**
   * Calculate category totals with limit information
   */
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
   * Check category limits and send notifications
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

  // ===== EXPENSE HANDLERS =====
  
  /**
   * Add new expense
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
          isRecurring: newExpense.isRecurring,
          dueDate: newExpense.dueDate || null,
          paid: false
        }
      ]);
      
      const newRemaining = getIncome() - (calculateTotalExpenses() + parseFloat(newExpense.amount));
      if (newRemaining < 0 && !wasOverBudget) {
        playWarningSound();
      } else {
        playSuccessSound();
      }
      
      setNewExpense({ name: '', amount: '', category: 'food', isRecurring: false, dueDate: '', paid: false });
      setTimeout(() => checkCategoryLimits(), 100);
    }
  };

  /**
   * Delete expense
   */
  const handleDeleteExpense = (id) => {
    const expenses = getExpenses();
    setExpenses(expenses.filter(expense => expense.id !== id));
    playDeleteSound();
  };

  /**
   * Toggle expense recurring status
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

   // ===== SAVINGS GOALS HANDLERS ===== ADD THIS ENTIRE SECTION

  /**
   * Add a new savings goal
   */
  const handleAddGoal = (goalData) => {
    setSavingsGoals([...savingsGoals, goalData]);
    playClickSound();
  };

  /**
   * Update existing goal
   */
  const handleUpdateGoal = (updatedGoal) => {
    setSavingsGoals(savingsGoals.map(goal => 
      goal.id === updatedGoal.id ? updatedGoal : goal
    ));
    playClickSound();
  };

  /**
   * Delete a goal
   */
  const handleDeleteGoal = (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      setSavingsGoals(savingsGoals.filter(goal => goal.id !== goalId));
      playWarningSound();
    }
  };

  /**
   * Allocate funds to a goal
   */
  const handleAllocateFunds = (goalId) => {
    const surplus = calculateRemaining();
    if (surplus <= 0) {
      alert('No surplus available to allocate!');
      playWarningSound();
      return;
    }

    const amount = prompt(`How much would you like to allocate? (Available: ${formatCurrency(surplus)})`);
    if (!amount) return;

    const allocateAmount = parseFloat(amount);
    if (isNaN(allocateAmount) || allocateAmount <= 0) {
      alert('Please enter a valid amount!');
      playWarningSound();
      return;
    }

    if (allocateAmount > surplus) {
      alert('Cannot allocate more than available surplus!');
      playWarningSound();
      return;
    }

    setSavingsGoals(savingsGoals.map(goal => {
      if (goal.id === goalId) {
        return {
          ...goal,
          currentAmount: goal.currentAmount + allocateAmount
        };
      }
      return goal;
    }));

    playSuccessSound();
  };

  /**
   * Calculate monthly average surplus across all months
   */
  const calculateMonthlyAverageSurplus = () => {
    const months = Object.keys(monthlyBudgets);
    if (months.length === 0) return 0;

    const totalSurplus = months.reduce((sum, monthKey) => {
      const budget = monthlyBudgets[monthKey];
      const income = budget.income || 0;
      const expenses = budget.expenses?.reduce((total, exp) => total + exp.amount, 0) || 0;
      const surplus = income - expenses;
      return sum + (surplus > 0 ? surplus : 0);
    }, 0);

    return totalSurplus / months.length;
  };

  /**
   * Toggle expense paid status
   */
  const toggleExpensePaid = (id) => {
    const expenses = getExpenses();
    setExpenses(expenses.map(expense => 
      expense.id === id 
        ? { ...expense, paid: !expense.paid }
        : expense
    ));
    playClickSound();
  };

  /**
   * Start editing expense
   */
  const handleStartEdit = (expense) => {
    setEditingExpenseId(expense.id);
    setEditingExpenseData({ ...expense });
  };

  /**
   * Save edited expense
   */
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

  /**
   * Cancel editing
   */
  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setEditingExpenseData(null);
  };

  /**
   * Export budget data to CSV
   */
  const handleExportCSV = () => {
    const income = getIncome();
    const expenses = getExpenses();
    
    let csvContent = `Budget Report - ${formatMonthYear(currentMonth)}\n\n`;
    csvContent += "Category,Name,Amount,Due Date,Paid\n";
    csvContent += `Income,Monthly Income,${income},,\n`;
    
    expenses.forEach(expense => {
      const category = categories.find(c => c.id === expense.category);
      const name = expense.name.includes(',') ? `"${expense.name}"` : expense.name;
      csvContent += `${category.name},${name},${expense.amount},${expense.dueDate || ''},${expense.paid ? 'Yes' : 'No'}\n`;
    });
    
    csvContent += `\nSummary\n`;
    csvContent += `Total Income,,${income},,\n`;
    csvContent += `Total Expenses,,${calculateTotalExpenses()},,\n`;
    csvContent += `Remaining,,${calculateRemaining()},,\n`;
    
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
   * Navigate to previous month
   */
  const handlePreviousMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2);
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
    playClickSound();
  };

  /**
   * Navigate to next month
   */
  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const nextDate = new Date(year, month);
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
    playClickSound();
  };

  /**
   * Format month string for display
   */
  const formatMonthYear = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  /**
   * Get monthly history for charts
   */
  const getMonthlyHistory = () => {
    const months = Object.keys(monthlyBudgets).sort();
    return months.map(month => {
      const budget = monthlyBudgets[month];
      const expenses = budget.expenses || []; // Safe default to empty array
      const income = budget.income || 0;
      const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
      
      return {
        month: formatMonthYear(month).split(' ')[0],
        income: income,
        expenses: totalExpenses,
        remaining: income - totalExpenses
      };
    }).slice(-6);
  };

  /**
   * Reset all data
   */
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

  /**
   * Format currency
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // ===== MAIN RENDER =====
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
          {/* ===== TOP CONTROL BUTTONS ===== */}
          <div className="fixed top-4 right-4 flex gap-2 z-50">
            {/* User Info & Logout */}
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
            
            {/* Notification Toggle */}
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

            {/* Theme Toggle */}
            <button
              onClick={() => {
                playClickSound();
                setIsThemeModalOpen(true);
              }}
              className="border-2 p-2 transition-all hover:scale-110 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }}
              title="Change theme"
            >
              <Palette size={20} />
            </button>
            
            {/* Sound Toggle */}
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
          
          {/* ===== HEADER ===== */}
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

          {/* ===== MONTH NAVIGATION ===== */}
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
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          {/* ===== SCREEN NAVIGATION BUTTONS ===== */}
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

          {/* ADD VIEW MODE BUTTONS INSIDE DASHBOARD */}
          {screen === 'main' && (
            <div className="flex gap-2 mb-6 flex-wrap">
              <button
                onClick={() => {
                  playClickSound();
                  setViewMode('dashboard');
                }}
                className={`border-2 px-4 py-2 font-bold transition-all ${viewMode === 'dashboard' ? 'scale-105' : ''}`}
                style={{
                  backgroundColor: viewMode === 'dashboard' ? theme.colors.accent : theme.colors.secondary,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                📊 Overview
              </button>
              
              <button
                onClick={() => {
                  playClickSound();
                  setViewMode('calendar');
                }}
                className={`border-2 px-4 py-2 font-bold transition-all ${viewMode === 'calendar' ? 'scale-105' : ''}`}
                style={{
                  backgroundColor: viewMode === 'calendar' ? theme.colors.accent : theme.colors.secondary,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                📅 Calendar
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setViewMode('goals');
                }}
                className={`border-2 px-4 py-2 font-bold transition-all ${viewMode === 'goals' ? 'scale-105' : ''}`}
                style={{
                  backgroundColor: viewMode === 'goals' ? theme.colors.accent : theme.colors.secondary,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                🎯 Goals
              </button>
            </div>
          )}

          {/* ===== DASHBOARD SCREEN ===== */}
{screen === 'main' && (
  <>
    {/* Dashboard Overview View */}
    {viewMode === 'dashboard' && (
      <div className="space-y-6 animate-[fadeIn_0.3s_ease-in]" style={{ overflow: 'visible' }}>
        {/* Budget Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Income Card */}
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
              {getIncomeRecurring() && <Repeat size={16} className="animate-pulse" />}
            </div>
            <div className="text-2xl font-bold">{formatCurrency(getIncome())}</div>
          </div>

          {/* Expenses Card */}
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

          {/* Remaining Card */}
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

        {/* Bills Due Alert Banner */}
        <BillsDueAlert 
          billsDueThisWeek={getBillsDueThisWeek()}
          overdueBills={getOverdueBills()}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />

        {/* Category Budget Alerts */}
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

        {/* Monthly Trends Chart */}
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
                <XAxis dataKey="month" stroke={theme.colors.text} style={{ fontFamily: 'monospace', fontSize: '12px' }} />
                <YAxis stroke={theme.colors.text} style={{ fontFamily: 'monospace', fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme.colors.surface,
                    border: `2px solid ${theme.colors.border}`,
                    color: theme.colors.text,
                    fontFamily: 'monospace'
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px' }} />
                <Bar dataKey="income" fill={theme.colors.success} stroke="#000" strokeWidth={2} name="Income" />
                <Bar dataKey="expenses" fill={theme.colors.error} stroke="#000" strokeWidth={2} name="Expenses" />
                <Bar dataKey="remaining" fill={theme.colors.accent} stroke="#000" strokeWidth={2} name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pie Chart */}
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
                >
                  {calculateCategoryTotals().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme.colors.surface,
                    border: `2px solid ${theme.colors.border}`,
                    color: theme.colors.text,
                    fontFamily: 'monospace'
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category Details */}
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
                  if (cat.isOverLimit) barColor = theme.colors.error;
                  else if (cat.isNearLimit) barColor = theme.colors.warning;
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
                      /* Edit Mode */
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingExpenseData.name}
                          onChange={(e) => setEditingExpenseData({ ...editingExpenseData, name: e.target.value })}
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
                        
                        <div>
                          <label className="text-xs font-bold mb-1 block" style={{ color: theme.colors.text }}>
                            📅 Due Date
                          </label>
                          <input
                            type="date"
                            value={editingExpenseData.dueDate || ''}
                            onChange={(e) => setEditingExpenseData({ ...editingExpenseData, dueDate: e.target.value })}
                            className="w-full border-2 p-2 font-bold outline-none"
                            style={{
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.border,
                              color: theme.colors.text
                            }}
                          />
                        </div>
                        
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

                        {editingExpenseData.dueDate && (
                          <button
                            type="button"
                            onClick={() => setEditingExpenseData({ ...editingExpenseData, paid: !editingExpenseData.paid })}
                            className="w-full border-2 p-2 font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                            style={{
                              backgroundColor: editingExpenseData.paid ? theme.colors.success : theme.colors.secondary,
                              borderColor: theme.colors.border,
                              color: theme.colors.text
                            }}
                          >
                            {editingExpenseData.paid ? '✓' : '○'}
                            {editingExpenseData.paid ? 'PAID ✓' : 'MARK AS PAID'}
                          </button>
                        )}
                        
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
                      /* View Mode */
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-3 h-3 border-2 border-black flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <div className="flex-1">
                            <div className="font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                              {expense.name}
                              {expense.isRecurring && (
                                <Repeat size={14} style={{ color: theme.colors.success }} />
                              )}
                              {expense.paid && (
                                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: theme.colors.success, color: theme.colors.text }}>
                                  PAID
                                </span>
                              )}
                            </div>
                            <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                              {category.name}
                              {expense.dueDate && (
                                <span className="ml-2">
                                  • Due: {formatDate(expense.dueDate)}
                                  {isOverdue(expense.dueDate) && !expense.paid && <span style={{ color: theme.colors.error }}> (OVERDUE)</span>}
                                  {isDueSoon(expense.dueDate) && !isOverdue(expense.dueDate) && !expense.paid && <span style={{ color: theme.colors.warning }}> (Soon)</span>}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold" style={{ color: theme.colors.text }}>{formatCurrency(expense.amount)}</span>
                          
                          {expense.dueDate && (
                            <button
                              onClick={() => toggleExpensePaid(expense.id)}
                              className="border-2 p-2 transition-all hover:scale-110 active:scale-95"
                              style={{
                                backgroundColor: expense.paid ? theme.colors.success : theme.colors.secondary,
                                borderColor: theme.colors.border,
                                color: theme.colors.text,
                                opacity: expense.paid ? 0.7 : 1
                              }}
                              title={expense.paid ? "Mark as unpaid" : "Mark as paid"}
                            >
                              {expense.paid ? '✓' : '○'}
                            </button>
                          )}
                          
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
          </div>
        )}
      </div>
    )}

    {/* Calendar View */}
    {viewMode === 'calendar' && (
      <div className="animate-[fadeIn_0.3s_ease-in]" style={{overflow: 'visible', position: 'relative'}}>
        <CalendarView 
          expenses={getExpenses()}
          formatCurrency={formatCurrency}
          categories={categories}
          currentMonth={currentMonth}
        />
      </div>
    )}

    {/* Goals View */}
    {viewMode === 'goals' && (
      <div className="animate-[fadeIn_0.3s_ease-in]">
        <SavingsGoals
          goals={savingsGoals}
          onAddGoal={handleAddGoal}
          onUpdateGoal={handleUpdateGoal}
          onDeleteGoal={handleDeleteGoal}
          onAllocateFunds={handleAllocateFunds}
          formatCurrency={formatCurrency}
          availableSurplus={calculateRemaining()}
          monthlyAverageSurplus={calculateMonthlyAverageSurplus()}
        />
      </div>
    )}
  </>
  )}

          {/* ===== INSIGHTS SCREEN ===== */}
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

          {/* ===== SETTINGS/MANAGE SCREEN ===== */}
          {screen === 'settings' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-in]">
              {/* Income Input */}
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
                </div>
              </div>

              {/* Add Expense */}
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

                  <div>
                    <label className="text-sm font-bold mb-2 block" style={{ color: theme.colors.text }}>
                      📅 Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={newExpense.dueDate}
                      onChange={(e) => setNewExpense({ ...newExpense, dueDate: e.target.value })}
                      className="w-full border-4 p-3 font-bold outline-none"
                      style={{
                        backgroundColor: theme.colors.secondary,
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                      }}
                    />
                    <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                      💡 Set a due date to get reminders for bills
                    </p>
                  </div>
                  
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

              {/* Manage Expenses */}
              {getExpenses().length > 0 && (
                <div 
                  className="border-4 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border
                  }}
                >
                  <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>✏️ MANAGE EXPENSES</h3>
                  <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
                    Edit, delete, or mark your expenses as paid for {formatMonthYear(currentMonth)}
                  </p>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
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
                            /* Edit Mode */
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editingExpenseData.name}
                                onChange={(e) => setEditingExpenseData({ ...editingExpenseData, name: e.target.value })}
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
                              
                              <div>
                                <label className="text-xs font-bold mb-1 block" style={{ color: theme.colors.text }}>
                                  📅 Due Date
                                </label>
                                <input
                                  type="date"
                                  value={editingExpenseData.dueDate || ''}
                                  onChange={(e) => setEditingExpenseData({ ...editingExpenseData, dueDate: e.target.value })}
                                  className="w-full border-2 p-2 font-bold outline-none"
                                  style={{
                                    backgroundColor: theme.colors.surface,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.text
                                  }}
                                />
                              </div>
                              
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

                              {editingExpenseData.dueDate && (
                                <button
                                  type="button"
                                  onClick={() => setEditingExpenseData({ ...editingExpenseData, paid: !editingExpenseData.paid })}
                                  className="w-full border-2 p-2 font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                                  style={{
                                    backgroundColor: editingExpenseData.paid ? theme.colors.success : theme.colors.secondary,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.text
                                  }}
                                >
                                  {editingExpenseData.paid ? '✓' : '○'}
                                  {editingExpenseData.paid ? 'PAID ✓' : 'MARK AS PAID'}
                                </button>
                              )}
                              
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
                            /* View Mode */
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div
                                  className="w-3 h-3 border-2 border-black flex-shrink-0"
                                  style={{ backgroundColor: category.color }}
                                />
                                <div className="flex-1">
                                  <div className="font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                                    {expense.name}
                                    {expense.isRecurring && (
                                      <Repeat size={14} style={{ color: theme.colors.success }} />
                                    )}
                                    {expense.paid && (
                                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: theme.colors.success, color: theme.colors.text }}>
                                        PAID
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                                    {category.name}
                                    {expense.dueDate && (
                                      <span className="ml-2">
                                        • Due: {formatDate(expense.dueDate)}
                                        {isOverdue(expense.dueDate) && !expense.paid && <span style={{ color: theme.colors.error }}> (OVERDUE)</span>}
                                        {isDueSoon(expense.dueDate) && !isOverdue(expense.dueDate) && !expense.paid && <span style={{ color: theme.colors.warning }}> (Soon)</span>}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-lg mr-2" style={{ color: theme.colors.text }}>
                                  {formatCurrency(expense.amount)}
                                </span>
                                
                                {expense.dueDate && (
                                  <button
                                    onClick={() => toggleExpensePaid(expense.id)}
                                    className="border-2 p-2 transition-all hover:scale-110 active:scale-95"
                                    style={{
                                      backgroundColor: expense.paid ? theme.colors.success : theme.colors.secondary,
                                      borderColor: theme.colors.border,
                                      color: theme.colors.text,
                                      opacity: expense.paid ? 0.7 : 1
                                    }}
                                    title={expense.paid ? "Mark as unpaid" : "Mark as paid"}
                                  >
                                    {expense.paid ? '✓' : '○'}
                                  </button>
                                )}
                                
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
                  
                  <div 
                    className="mt-4 pt-4 border-t-2 flex justify-between items-center"
                    style={{ borderColor: theme.colors.border }}
                  >
                    <span className="font-bold" style={{ color: theme.colors.text }}>
                      Total Expenses: {getExpenses().length}
                    </span>
                    <span className="font-bold text-lg" style={{ color: theme.colors.text }}>
                      {formatCurrency(calculateTotalExpenses())}
                    </span>
                  </div>
                </div>
              )}

              {/* Category Limits */}
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
              </div>

              {/* Export Data */}
              <div 
                className="border-4 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }}
              >
                <h3 className="text-xl font-bold mb-4" style={{ color: theme.colors.text }}>📥 EXPORT DATA</h3>
                <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>Download your budget data as a CSV file.</p>
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

              {/* Reset Data */}
              <div 
                className="border-4 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }}
              >
                <h3 className="text-xl font-bold mb-4" style={{ color: theme.colors.text }}>⚠️ DANGER ZONE</h3>
                <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>Reset all data and start fresh. This cannot be undone!</p>
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
      
      {/* Theme Modal */}
      <ThemeModal 
        isOpen={isThemeModalOpen}
        onClose={() => {
          playClickSound();
          setIsThemeModalOpen(false);
        }}
      />
    </div>
  );
}

/**
 * AppWithAuth Wrapper - Shows login or main app based on auth state
 */
function AppWithAuth() {
  const { user } = useAuth();
  if (!user) return <Login />;
  return <MainApp />;
}

/**
 * Main App Export - Wraps with providers
 */
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppWithAuth />
      </ThemeProvider>
    </AuthProvider>
  );
}