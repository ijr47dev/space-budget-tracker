import React, { useState, useEffect } from 'react';
import { Rocket, Trash2, Plus, DollarSign, TrendingDown, TrendingUp, Edit2, Save, X, Download, Volume2, VolumeX } from 'lucide-react';

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
  const [income, setIncome] = useState(0); // Stores user's total income
  const [expenses, setExpenses] = useState([]); // Array of expense objects
  const [newExpense, setNewExpense] = useState({ // Form state for adding new expenses
    name: '',
    amount: '',
    category: 'food'
  });
  const [screen, setScreen] = useState('main'); // Controls which screen is displayed
  const [isLoaded, setIsLoaded] = useState(false); // Tracks if data has been loaded from localStorage
  const [editingExpenseId, setEditingExpenseId] = useState(null); // Tracks which expense is being edited
  const [editingExpenseData, setEditingExpenseData] = useState(null); // Holds the temporary edit data
  const [soundEnabled, setSoundEnabled] = useState(true); // Controls whether sound effects are enabled

  /**
   * useEffect Hook: Load data from localStorage when component first mounts
   * This runs once when the app starts, restoring any saved data
   */
  useEffect(() => {
    // Retrieve saved income from localStorage
    const savedIncome = localStorage.getItem('budgetIncome');
    if (savedIncome) {
      setIncome(parseFloat(savedIncome));
    }

    // Retrieve saved expenses from localStorage
    const savedExpenses = localStorage.getItem('budgetExpenses');
    if (savedExpenses) {
      try {
        // Parse the JSON string back into an array
        setExpenses(JSON.parse(savedExpenses));
      } catch (error) {
        console.error('Error loading expenses:', error);
      }
    }

    // Mark that we've finished loading
    setIsLoaded(true);
  }, []); // Empty dependency array means this runs only once on mount

  /**
   * useEffect Hook: Save income to localStorage whenever it changes
   * The dependency array [income] means this runs every time income updates
   */
  useEffect(() => {
    // Only save after initial load to avoid overwriting with default value
    if (isLoaded) {
      localStorage.setItem('budgetIncome', income.toString());
    }
  }, [income, isLoaded]); // Runs when income or isLoaded changes

  /**
   * useEffect Hook: Save expenses to localStorage whenever they change
   * The dependency array [expenses] means this runs every time expenses updates
   */
  useEffect(() => {
    // Only save after initial load to avoid overwriting with default value
    if (isLoaded) {
      // Convert array to JSON string for storage
      localStorage.setItem('budgetExpenses', JSON.stringify(expenses));
    }
  }, [expenses, isLoaded]); // Runs when expenses or isLoaded changes

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
    return expenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);
  };

  /**
   * Calculates remaining budget after expenses
   * @returns {number} Income minus total expenses
   */
  const calculateRemaining = () => {
    return income - calculateTotalExpenses();
  };

  /**
   * Calculates expenses by category for visualization
   * @returns {Array} Array of objects with category totals
   */
  const calculateCategoryTotals = () => {
    const totals = {};
    
    // Initialize all categories to 0
    categories.forEach(cat => {
      totals[cat.id] = 0;
    });
    
    // Sum up expenses by category
    expenses.forEach(expense => {
      totals[expense.category] += parseFloat(expense.amount);
    });
    
    // Convert to array format with category details
    return categories.map(cat => ({
      ...cat,
      total: totals[cat.id],
      percentage: income > 0 ? (totals[cat.id] / income) * 100 : 0
    })).filter(cat => cat.total > 0); // Only show categories with expenses
  };

  /**
   * Adds a new expense to the expenses array
   * Validates that name and amount are provided
   */
  const handleAddExpense = () => {
    if (newExpense.name && newExpense.amount) {
      const wasOverBudget = calculateRemaining() < 0;
      
      setExpenses([
        ...expenses,
        {
          id: Date.now(), // Simple unique ID using timestamp
          name: newExpense.name,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category
        }
      ]);
      
      // Play sound after adding
      const newRemaining = income - (calculateTotalExpenses() + parseFloat(newExpense.amount));
      if (newRemaining < 0 && !wasOverBudget) {
        playWarningSound(); // Play warning if just went over budget
      } else {
        playSuccessSound(); // Play success sound
      }
      
      // Reset form after adding
      setNewExpense({ name: '', amount: '', category: 'food' });
    }
  };

  /**
   * Removes an expense from the expenses array
   * @param {number} id - The unique ID of the expense to delete
   */
  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
    playDeleteSound(); // Play delete sound
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
    // Create CSV header
    let csvContent = "Category,Name,Amount\n";
    
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
    link.setAttribute('download', `space-budget-${date}.csv`);
    
    // Trigger download
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Clears all data from localStorage and resets the app
   * Useful for starting fresh or testing
   */
  const handleResetData = () => {
    if (window.confirm('🚀 Are you sure you want to reset all data? This cannot be undone!')) {
      localStorage.removeItem('budgetIncome');
      localStorage.removeItem('budgetExpenses');
      setIncome(0);
      setExpenses([]);
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

      {/* Mute Button */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (soundEnabled) {
                  playClickSound(); // Play one last sound before muting
                }
              }}
              className="absolute top-4 right-5 bg-gray-800 hover:bg-gray-700 border-2 border-white p-2 transition-all hover:scale-110"
              title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
      
      {/* Main Container */}
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 mt-8">
          <div className="inline-block bg-black border-4 border-white p-6 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] relative">
            
            
            <div className="flex items-center justify-center gap-3 mb-2">
              <Rocket size={32} className="animate-bounce" />
              <h1 className="text-4xl font-bold">SPACE BUDGET</h1>
              <Rocket size={32} className="animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <p className="text-sm text-gray-400">NES EDITION v1.0</p>
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
            </div>
            <div className="text-2xl font-bold">{formatCurrency(income)}</div>
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

        {/* Category Breakdown */}
        {expenses.length > 0 && (
          <div className="bg-gray-800 border-4 border-gray-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-bold mb-4">📊 CATEGORY BREAKDOWN</h3>
            <div className="space-y-3">
              {calculateCategoryTotals().map(cat => (
                <div key={cat.id}>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>{cat.name}</span>
                    <span className="font-bold">{formatCurrency(cat.total)}</span>
                  </div>
                  <div className="w-full bg-gray-900 h-6 border-2 border-black">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(cat.percentage, 100)}%`,
                        backgroundColor: cat.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Expenses List */}
        {expenses.length > 0 && (
          <div className="bg-gray-800 border-4 border-gray-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-bold mb-4">📝 RECENT EXPENSES</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {expenses.map(expense => {
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
                            <div className="font-bold">{expense.name}</div>
                            <div className="text-xs text-gray-400">{category.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{formatCurrency(expense.amount)}</span>
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
        {expenses.length === 0 && (
          <div className="text-center py-12 bg-gray-800 border-4 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Rocket size={48} className="mx-auto mb-4 animate-bounce" />
            <p className="text-xl font-bold mb-2">NO EXPENSES YET!</p>
            <p className="text-gray-400">Add your income and start tracking expenses</p>
          </div>
        )}</div>
        )}

        {/* Settings Screen Content */}
        {screen === 'settings' && (
          <div className="space-y-6 animate-[fadeIn_0.3s_ease-in]">{/* Income Input Section */}
        <div className="bg-gray-800 border-4 border-gray-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xl font-bold mb-4">💰 SET INCOME</h3>
          <div className="flex gap-2">
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
              placeholder="Enter your income"
              className="flex-1 bg-gray-900 border-4 border-gray-700 p-3 text-white font-bold focus:border-white outline-none"
            />
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