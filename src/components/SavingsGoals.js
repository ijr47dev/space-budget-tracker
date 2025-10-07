// src/components/SavingsGoals.js
import React, { useState } from 'react';
import { Target, Trash2, Edit2, TrendingUp, Calendar } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

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
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: 0,
    emoji: '🎯',
    color: theme.colors.accent
  });

  // Available emojis for goals
  const goalEmojis = ['🎯', '🏠', '✈️', '🚗', '💰', '🎓', '💍', '🎮', '📱', '⚡', '🌟', '💎'];
  
  // Available colors
  const goalColors = [
    '#FFD700', // Gold
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DFE6E9', // Gray
    '#A29BFE', // Purple
    '#FD79A8', // Pink
    '#FDCB6E', // Orange
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.targetAmount) return;
    
    const goalData = {
      id: editingId || Date.now(),
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount) || 0,
      emoji: formData.emoji,
      color: formData.color,
      createdAt: editingId ? undefined : new Date().toISOString()
    };

    if (editingId) {
      onUpdateGoal(goalData);
    } else {
      onAddGoal(goalData);
    }

    // Reset form
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: 0,
      emoji: '🎯',
      color: theme.colors.accent
    });
    setIsAdding(false);
    setEditingId(null);
  };

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

  const handleCancel = () => {
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: 0,
      emoji: '🎯',
      color: theme.colors.accent
    });
    setIsAdding(false);
    setEditingId(null);
  };

  // Calculate progress percentage
  const getProgress = (goal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  // Calculate months to reach goal
  const getMonthsToGoal = (goal) => {
    if (monthlyAverageSurplus <= 0) return 'N/A';
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return 'Achieved! 🎉';
    const months = Math.ceil(remaining / monthlyAverageSurplus);
    return months === 1 ? '1 month' : `${months} months`;
  };

  // Get achievement badge
  const getAchievementBadge = (goal) => {
    const progress = getProgress(goal);
    if (progress >= 100) return { emoji: '🏆', text: 'COMPLETED!', color: '#FFD700' };
    if (progress >= 75) return { emoji: '🔥', text: 'Almost There!', color: '#FF6B6B' };
    if (progress >= 50) return { emoji: '⭐', text: 'Halfway!', color: '#4ECDC4' };
    if (progress >= 25) return { emoji: '🚀', text: 'Great Start!', color: '#96CEB4' };
    return null;
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-in]">
      {/* Header */}
      <div 
        className="border-4 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={24} style={{ color: theme.colors.accent }} />
            <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>
              🎯 SAVINGS GOALS
            </h2>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="border-2 px-4 py-2 font-bold transition-all hover:scale-105"
            style={{
              backgroundColor: isAdding ? theme.colors.error : theme.colors.success,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            {isAdding ? 'Cancel' : '+ New Goal'}
          </button>
        </div>

        {/* Available Surplus Info */}
        <div className="mt-4 p-3 border-2" style={{ 
          backgroundColor: `${theme.colors.accent}20`,
          borderColor: theme.colors.accent 
        }}>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: theme.colors.text }}>💰 Available to Allocate:</span>
            <span className="font-bold text-lg" style={{ color: theme.colors.accent }}>
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

      {/* Add/Edit Goal Form */}
      {isAdding && (
        <div 
          className="border-4 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: theme.colors.text }}>
            {editingId ? '✏️ Edit Goal' : '✨ New Savings Goal'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Goal Name */}
            <div>
              <label className="block text-sm font-bold mb-1" style={{ color: theme.colors.text }}>
                Goal Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Vacation Fund"
                className="w-full border-2 px-3 py-2 font-mono"
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
              <label className="block text-sm font-bold mb-1" style={{ color: theme.colors.text }}>
                Target Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                placeholder="3000.00"
                className="w-full border-2 px-3 py-2 font-mono"
                style={{
                  backgroundColor: theme.colors.secondary,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
                required
              />
            </div>

            {/* Current Amount */}
            <div>
              <label className="block text-sm font-bold mb-1" style={{ color: theme.colors.text }}>
                Current Amount (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.currentAmount}
                onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                placeholder="0.00"
                className="w-full border-2 px-3 py-2 font-mono"
                style={{
                  backgroundColor: theme.colors.secondary,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            {/* Emoji Selection */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: theme.colors.text }}>
                Choose Emoji
              </label>
              <div className="grid grid-cols-6 gap-2">
                {goalEmojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, emoji })}
                    className={`text-2xl p-2 border-2 transition-all hover:scale-110 ${
                      formData.emoji === emoji ? 'scale-110' : ''
                    }`}
                    style={{
                      backgroundColor: formData.emoji === emoji ? theme.colors.accent : theme.colors.secondary,
                      borderColor: formData.emoji === emoji ? theme.colors.border : theme.colors.border
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: theme.colors.text }}>
                Choose Color
              </label>
              <div className="grid grid-cols-5 gap-2">
                {goalColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-10 border-2 transition-all hover:scale-110 ${
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

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 border-2 px-4 py-2 font-bold transition-all hover:scale-105"
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
                className="border-2 px-4 py-2 font-bold transition-all hover:scale-105"
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

      {/* Goals List */}
      {goals.length === 0 ? (
        <div 
          className="border-4 p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }}
        >
          <Target size={48} className="mx-auto mb-4" style={{ color: theme.colors.textSecondary }} />
          <p className="text-lg font-bold mb-2" style={{ color: theme.colors.text }}>
            No Savings Goals Yet
          </p>
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            Create your first goal to start tracking your savings progress!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => {
            const progress = getProgress(goal);
            const monthsToGoal = getMonthsToGoal(goal);
            const achievement = getAchievementBadge(goal);
            
            return (
              <div
                key={goal.id}
                className="border-4 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }}
              >
                {/* Goal Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{goal.emoji}</span>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: theme.colors.text }}>
                        {goal.name}
                      </h3>
                      <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                        Target: {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-1 border-2 hover:scale-110 transition-all"
                      style={{
                        backgroundColor: theme.colors.secondary,
                        borderColor: theme.colors.border
                      }}
                    >
                      <Edit2 size={14} style={{ color: theme.colors.text }} />
                    </button>
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1 border-2 hover:scale-110 transition-all"
                      style={{
                        backgroundColor: theme.colors.error,
                        borderColor: theme.colors.border
                      }}
                    >
                      <Trash2 size={14} style={{ color: theme.colors.text }} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: theme.colors.text }}>
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="font-bold" style={{ color: goal.color }}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div 
                    className="w-full h-6 border-2 relative overflow-hidden"
                    style={{
                      backgroundColor: theme.colors.secondary,
                      borderColor: theme.colors.border
                    }}
                  >
                    <div
                      className="h-full transition-all duration-500"
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
                    className="mb-2 p-2 border-2 text-center text-sm font-bold"
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
                <div className="space-y-1 text-xs" style={{ color: theme.colors.textSecondary }}>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={12} />
                    <span>Remaining: {formatCurrency(goal.targetAmount - goal.currentAmount)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Estimated: {monthsToGoal}</span>
                  </div>
                </div>

                {/* Allocate Button */}
                {availableSurplus > 0 && progress < 100 && (
                  <button
                    onClick={() => onAllocateFunds(goal.id)}
                    className="w-full mt-3 border-2 px-3 py-2 text-sm font-bold transition-all hover:scale-105"
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
    </div>
  );
};

export default SavingsGoals;