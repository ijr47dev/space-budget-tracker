// src/components/SavingsGoals.js
import React, { useState } from 'react';
import { Target, Trash2, Edit2, TrendingUp, Calendar, HelpCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';

/**
 * SavingsGoals Component
 * Manages savings goals with progress tracking, allocations, and achievements
 */
const SavingsGoals = ({ 
  goals, 
  onAddGoal, 
  onUpdateGoal, 
  onDeleteGoal,
  onAllocateFunds,
  formatCurrency,
  availableSurplus,
  monthlyAverageSurplus
}) => {
  const { theme } = useTheme();
  
  // ===== STATE MANAGEMENT =====
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [celebratingGoal, setCelebratingGoal] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    goalId: null, 
    goalName: '' 
  });
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: 0,
    emoji: '🎯',
    color: '#FFD700'
  });

  // ===== CONSTANTS =====
  const goalEmojis = ['🎯', '🏠', '✈️', '🚗', '💰', '🎓', '💍', '🎮', '📱', '⚡', '🌟', '💎'];
  const goalColors = [
    '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DFE6E9', '#A29BFE', '#FD79A8', '#FDCB6E'
  ];

  // ===== HELPER FUNCTIONS =====
  
  /**
   * Calculate progress percentage for a goal
   */
  const getProgress = (goal) => {
    if (!goal || !goal.targetAmount) return 0;
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  /**
   * Calculate estimated months to reach goal
   */
  const getMonthsToGoal = (goal) => {
    if (!goal) return 'N/A';
    if (monthlyAverageSurplus <= 0) return 'N/A';
    
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return 'Achieved! 🎉';
    
    const months = Math.ceil(remaining / monthlyAverageSurplus);
    return months === 1 ? '1 month' : `${months} months`;
  };

  /**
   * Get achievement badge based on progress
   */
  const getAchievementBadge = (goal) => {
    if (!goal) return null;
    
    const progress = getProgress(goal);
    if (progress >= 100) return { emoji: '🏆', text: 'COMPLETED!', color: '#FFD700' };
    if (progress >= 75) return { emoji: '🔥', text: 'Almost There!', color: '#FF6B6B' };
    if (progress >= 50) return { emoji: '⭐', text: 'Halfway!', color: '#4ECDC4' };
    if (progress >= 25) return { emoji: '🚀', text: 'Great Start!', color: '#96CEB4' };
    return null;
  };

  // ===== FORM HANDLERS =====
  
  /**
   * Handle form submission (create or update goal)
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.targetAmount) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    if (parseFloat(formData.targetAmount) <= 0) {
      setToast({ message: 'Target amount must be greater than zero', type: 'error' });
      return;
    }

    if (parseFloat(formData.currentAmount) < 0) {
      setToast({ message: 'Current amount cannot be negative', type: 'error' });
      return;
    }
    
    // Create goal object
    const goalData = {
      id: editingId || Date.now(),
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount) || 0,
      emoji: formData.emoji,
      color: formData.color,
      createdAt: editingId ? undefined : new Date().toISOString()
    };

    // Save goal
    if (editingId) {
      onUpdateGoal(goalData);
      setToast({ message: `✅ Goal "${formData.name}" updated successfully!`, type: 'success' });
    } else {
      onAddGoal(goalData);
      setCelebratingGoal(goalData.id);
      setToast({ message: `🎉 New goal "${formData.name}" created!`, type: 'success' });
      
      setTimeout(() => setCelebratingGoal(null), 600);
    }

    // Reset form
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: 0,
      emoji: '🎯',
      color: '#FFD700'
    });
    setIsAdding(false);
    setEditingId(null);
  };

  /**
   * Start editing a goal
   */
  const handleEdit = (goal) => {
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount,
      emoji: goal.emoji,
      color: goal.color
    });
    setEditingId(goal.id);
    setIsAdding(true);
  };

  /**
   * Cancel form
   */
  const handleCancel = () => {
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: 0,
      emoji: '🎯',
      color: '#FFD700'
    });
    setIsAdding(false);
    setEditingId(null);
  };

  /**
   * Show delete confirmation dialog
   */
  const handleDeleteClick = (goal) => {
    setConfirmDialog({
      isOpen: true,
      goalId: goal.id,
      goalName: goal.name
    });
  };

  /**
   * Confirm goal deletion
   */
  const handleConfirmDelete = () => {
    onDeleteGoal(confirmDialog.goalId);
    setToast({ 
      message: `🗑️ Goal "${confirmDialog.goalName}" deleted`, 
      type: 'info' 
    });
    setConfirmDialog({ isOpen: false, goalId: null, goalName: '' });
  };

  /**
   * Handle fund allocation to a goal
   */
  const handleAllocateFunds = (goal) => {
    // Validate surplus availability
    if (availableSurplus <= 0) {
      setToast({ 
        message: '⚠️ No surplus available to allocate. Add income or reduce expenses first.', 
        type: 'warning' 
      });
      return;
    }

    // Calculate max allocation
    const remaining = goal.targetAmount - goal.currentAmount;
    const maxAmount = Math.min(availableSurplus, remaining);
    
    // Prompt user for amount
    const amount = prompt(
      `💰 Allocate to "${goal.name}"\n\n` +
      `Available Surplus: ${formatCurrency(availableSurplus)}\n` +
      `Remaining to Goal: ${formatCurrency(remaining)}\n` +
      `Max Recommended: ${formatCurrency(maxAmount)}\n\n` +
      `Enter amount to allocate:`
    );
    
    if (!amount) return;

    const allocateAmount = parseFloat(amount);
    
    // Validate input
    if (isNaN(allocateAmount) || allocateAmount <= 0) {
      setToast({ message: '⚠️ Please enter a valid positive amount', type: 'warning' });
      return;
    }

    if (allocateAmount > availableSurplus) {
      setToast({ 
        message: `⚠️ Cannot allocate more than available surplus (${formatCurrency(availableSurplus)})`, 
        type: 'warning' 
      });
      return;
    }

    // Allocate funds
    onAllocateFunds(goal.id, allocateAmount);
    setToast({ 
      message: `💰 ${formatCurrency(allocateAmount)} allocated to "${goal.name}"!`, 
      type: 'success' 
    });
  };

  // ===== RENDER =====
  return (
    <div className="space-y-4 md:space-y-6 animate-[fadeIn_0.3s_ease-in]">
      {/* ===== HEADER ===== */}
      <div 
        className="border-4 p-3 md:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target size={20} className="md:hidden" style={{ color: theme.colors.accent }} />
            <Target size={24} className="hidden md:block" style={{ color: theme.colors.accent }} />
            <h2 className="text-lg md:text-xl font-bold" style={{ color: theme.colors.text }}>
              🎯 SAVINGS GOALS
            </h2>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="w-full sm:w-auto border-2 px-4 py-2 text-sm md:text-base font-bold transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: isAdding ? theme.colors.error : theme.colors.success,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            {isAdding ? 'Cancel' : '+ New Goal'}
          </button>
        </div>

        {/* Surplus Info */}
        <div className="mt-3 md:mt-4 p-2 md:p-3 border-2" style={{ 
          backgroundColor: `${theme.colors.accent}20`,
          borderColor: theme.colors.accent 
        }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs md:text-sm gap-1">
            <span style={{ color: theme.colors.text }}>💰 Available to Allocate:</span>
            <span className="font-bold text-base md:text-lg" style={{ color: theme.colors.accent }}>
              {formatCurrency(availableSurplus)}
            </span>
          </div>
          {monthlyAverageSurplus > 0 && (
            <div className="mt-1 text-xs" style={{ color: theme.colors.textSecondary }}>
              Average monthly surplus: {formatCurrency(monthlyAverageSurplus)}
            </div>
          )}
        </div>
      </div>

      {/* ===== ADD/EDIT FORM ===== */}
      {isAdding && (
        <div 
          className="border-4 p-3 md:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }}
        >
          <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4" style={{ color: theme.colors.text }}>
            {editingId ? '✏️ Edit Goal' : '✨ New Savings Goal'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            {/* Goal Name */}
            <div>
              <label className="block text-xs md:text-sm font-bold mb-1" style={{ color: theme.colors.text }}>
                Goal Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Vacation Fund"
                className="w-full border-2 px-3 py-2 text-sm md:text-base font-mono"
                style={{
                  backgroundColor: theme.colors.secondary,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
                required
              />
            </div>

            {/* Target Amount */}
            <div>
              <label className=" text-xs md:text-sm font-bold mb-1 flex items-center gap-2" style={{ color: theme.colors.text }}>
                Target Amount *
                <span 
                  className="cursor-help" 
                  title="The total amount you want to save for this goal"
                  style={{ color: theme.colors.textSecondary }}
                >
                  <HelpCircle size={14} />
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                placeholder="3000.00"
                className="w-full border-2 px-3 py-2 text-sm md:text-base font-mono"
                style={{
                  backgroundColor: theme.colors.secondary,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
                required
                min="0.01"
              />
            </div>

            {/* Current Amount */}
            <div>
              <label className=" text-xs md:text-sm font-bold mb-1 flex items-center gap-2" style={{ color: theme.colors.text }}>
                Current Amount (Optional)
                <span 
                  className="cursor-help" 
                  title="How much you've already saved toward this goal"
                  style={{ color: theme.colors.textSecondary }}
                >
                  <HelpCircle size={14} />
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.currentAmount}
                onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                placeholder="0.00"
                className="w-full border-2 px-3 py-2 text-sm md:text-base font-mono"
                style={{
                  backgroundColor: theme.colors.secondary,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
                min="0"
              />
            </div>

            {/* Emoji Selection */}
            <div>
              <label className="block text-xs md:text-sm font-bold mb-2" style={{ color: theme.colors.text }}>
                Choose Emoji
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1 md:gap-2">
                {goalEmojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, emoji })}
                    className={`text-xl md:text-2xl p-2 border-2 transition-all active:scale-95 hover:scale-110 ${
                      formData.emoji === emoji ? 'scale-110' : ''
                    }`}
                    style={{
                      backgroundColor: formData.emoji === emoji ? theme.colors.accent : theme.colors.secondary,
                      borderColor: theme.colors.border
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-xs md:text-sm font-bold mb-2" style={{ color: theme.colors.text }}>
                Choose Color
              </label>
              <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-1 md:gap-2">
                {goalColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-10 md:h-12 border-2 transition-all active:scale-95 hover:scale-110 ${
                      formData.color === color ? 'scale-110' : ''
                    }`}
                    style={{
                      backgroundColor: color,
                      borderColor: formData.color === color ? '#000' : theme.colors.border,
                      borderWidth: formData.color === color ? '3px' : '2px'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Form Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="flex-1 border-2 px-4 py-2 text-sm md:text-base font-bold transition-all active:scale-95 hover:scale-105"
                style={{
                  backgroundColor: theme.colors.success,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                {editingId ? 'Update Goal' : 'Create Goal'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="border-2 px-4 py-2 text-sm md:text-base font-bold transition-all active:scale-95 hover:scale-105"
                style={{
                  backgroundColor: theme.colors.error,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== GOALS LIST ===== */}
      {goals.length === 0 ? (
        // Empty State
        <div 
          className="border-4 p-8 md:p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }}
        >
          <Target size={40} className="mx-auto mb-4 md:hidden" style={{ color: theme.colors.textSecondary }} />
          <Target size={64} className="mx-auto mb-6 hidden md:block" style={{ color: theme.colors.textSecondary }} />
          <p className="text-lg md:text-xl font-bold mb-3" style={{ color: theme.colors.text }}>
            Start Your Savings Journey! 🎯
          </p>
          <p className="text-sm md:text-base mb-6 max-w-md mx-auto" style={{ color: theme.colors.textSecondary }}>
            Create your first savings goal and watch your progress grow. Whether it's a vacation, emergency fund, or dream purchase - start here!
          </p>
          <div className="space-y-2 text-xs md:text-sm text-left max-w-sm mx-auto mb-6" style={{ color: theme.colors.textSecondary }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <span>Set clear financial goals</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <span>Track your progress visually</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              <span>Allocate surplus automatically</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <span>Earn achievement badges</span>
            </div>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="border-4 px-6 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: theme.colors.accent,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            🎯 Create Your First Goal
          </button>
        </div>
      ) : (
        // Goals Grid
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {goals.map(goal => {
            const progress = getProgress(goal);
            const monthsToGoal = getMonthsToGoal(goal);
            const achievement = getAchievementBadge(goal);
            
            return (
              <div
                key={goal.id}
                className={`border-4 p-3 md:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all ${
                  celebratingGoal === goal.id ? 'animate-celebrate' : 'animate-popIn'
                }`}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }}
              >
                {/* Goal Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-2xl md:text-3xl flex-shrink-0">{goal.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm md:text-lg truncate" style={{ color: theme.colors.text }}>
                        {goal.name}
                      </h3>
                      <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                        Target: {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-1 md:p-2 border-2 active:scale-95 hover:scale-110 transition-all"
                      style={{
                        backgroundColor: theme.colors.secondary,
                        borderColor: theme.colors.border
                      }}
                      title="Edit goal"
                    >
                      <Edit2 size={14} className="md:hidden" style={{ color: theme.colors.text }} />
                      <Edit2 size={16} className="hidden md:block" style={{ color: theme.colors.text }} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(goal)}
                      className="p-1 md:p-2 border-2 active:scale-95 hover:scale-110 transition-all"
                      style={{
                        backgroundColor: theme.colors.error,
                        borderColor: theme.colors.border
                      }}
                      title="Delete goal"
                    >
                      <Trash2 size={14} className="md:hidden" style={{ color: theme.colors.text }} />
                      <Trash2 size={16} className="hidden md:block" style={{ color: theme.colors.text }} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs md:text-sm mb-1">
                    <span style={{ color: theme.colors.text }}>
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="font-bold" style={{ color: goal.color }}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div 
                    className="w-full h-5 md:h-6 border-2 relative overflow-hidden"
                    style={{
                      backgroundColor: theme.colors.secondary,
                      borderColor: theme.colors.border
                    }}
                  >
                    <div
                      className="h-full transition-all duration-500 animate-fillProgress"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: goal.color
                      }}
                    />
                  </div>
                </div>

                {/* Achievement Badge */}
                {achievement && (
                  <div 
                    className="mb-2 p-2 border-2 text-center text-xs md:text-sm font-bold animate-popIn"
                    style={{
                      backgroundColor: `${achievement.color}30`,
                      borderColor: achievement.color,
                      color: theme.colors.text
                    }}
                  >
                    {achievement.emoji} {achievement.text}
                  </div>
                )}

                {/* Stats */}
                <div className="space-y-1 text-xs mb-3" style={{ color: theme.colors.textSecondary }}>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={12} className="flex-shrink-0" />
                    <span className="truncate">Remaining: {formatCurrency(goal.targetAmount - goal.currentAmount)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="flex-shrink-0" />
                    <span className="truncate">Estimated: {monthsToGoal}</span>
                  </div>
                </div>

                {/* Allocate Button */}
                {availableSurplus > 0 && progress < 100 && (
                  <button
                    onClick={() => handleAllocateFunds(goal)}
                    className="w-full border-2 px-3 py-2 text-xs md:text-sm font-bold transition-all active:scale-95 hover:scale-105"
                    style={{
                      backgroundColor: theme.colors.accent,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                  >
                    💰 Allocate Funds
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== TOAST NOTIFICATION ===== */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ===== CONFIRMATION DIALOG ===== */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, goalId: null, goalName: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete Goal?"
        message={`Are you sure you want to delete "${confirmDialog.goalName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Keep It"
        type="danger"
      />
    </div>
  );
};

export default SavingsGoals;