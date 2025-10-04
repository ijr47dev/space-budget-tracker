import React from 'react';
import { TrendingUp, TrendingDown, Award, AlertCircle, Zap } from 'lucide-react';

/**
 * Budget Insights Component
 * Shows intelligent analytics and spending patterns
 */
export default function Insights({ monthlyBudgets, currentMonth, formatCurrency, categories }) {
  
  /**
   * Calculate total spending across all months
   */
  const calculateAllTimeStats = () => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let monthCount = 0;
    
    Object.keys(monthlyBudgets).forEach(month => {
      const data = monthlyBudgets[month];
      totalIncome += data.income || 0;
      
      if (data.expenses && data.expenses.length > 0) {
        data.expenses.forEach(exp => {
          totalExpenses += parseFloat(exp.amount);
        });
      }
      monthCount++;
    });
    
    return {
      totalIncome,
      totalExpenses,
      totalSaved: totalIncome - totalExpenses,
      avgMonthlyIncome: monthCount > 0 ? totalIncome / monthCount : 0,
      avgMonthlyExpenses: monthCount > 0 ? totalExpenses / monthCount : 0,
      monthCount
    };
  };

  /**
   * Find best and worst saving months
   */
  const getBestWorstMonths = () => {
    const monthsWithSavings = Object.keys(monthlyBudgets).map(month => {
      const data = monthlyBudgets[month];
      const income = data.income || 0;
      const expenses = data.expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0;
      const saved = income - expenses;
      
      return {
        month,
        saved,
        income,
        expenses
      };
    }).filter(m => m.income > 0);
    
    if (monthsWithSavings.length === 0) return { best: null, worst: null };
    
    const sorted = [...monthsWithSavings].sort((a, b) => b.saved - a.saved);
    
    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1]
    };
  };

  /**
   * Calculate spending by category across all months
   */
  const getCategoryBreakdown = () => {
    const categoryTotals = {};
    let totalSpending = 0;
    
    categories.forEach(cat => {
      categoryTotals[cat.id] = { ...cat, total: 0 };
    });
    
    Object.keys(monthlyBudgets).forEach(month => {
      const data = monthlyBudgets[month];
      if (data.expenses) {
        data.expenses.forEach(exp => {
          const amount = parseFloat(exp.amount);
          categoryTotals[exp.category].total += amount;
          totalSpending += amount;
        });
      }
    });
    
    return Object.values(categoryTotals)
      .filter(cat => cat.total > 0)
      .map(cat => ({
        ...cat,
        percentage: totalSpending > 0 ? (cat.total / totalSpending) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  };

  /**
   * Get top 5 largest expenses
   */
  const getTopExpenses = () => {
    const allExpenses = [];
    
    Object.keys(monthlyBudgets).forEach(month => {
      const data = monthlyBudgets[month];
      if (data.expenses) {
        data.expenses.forEach(exp => {
          const category = categories.find(c => c.id === exp.category);
          allExpenses.push({
            ...exp,
            month,
            categoryName: category?.name || 'Other'
          });
        });
      }
    });
    
    return allExpenses
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
      .slice(0, 5);
  };

  /**
   * Calculate budget performance score (0-100)
   */
  const getBudgetScore = () => {
    const stats = calculateAllTimeStats();
    
    if (stats.totalIncome === 0) return 0;
    
    const savingsRate = (stats.totalSaved / stats.totalIncome) * 100;
    
    // Score based on savings rate
    if (savingsRate >= 30) return 100;
    if (savingsRate >= 20) return 90;
    if (savingsRate >= 10) return 75;
    if (savingsRate >= 5) return 60;
    if (savingsRate >= 0) return 50;
    return Math.max(0, 50 + savingsRate); // Negative savings
  };

  /**
   * Get current month vs previous month trend
   */
  const getSpendingTrend = () => {
    const months = Object.keys(monthlyBudgets).sort();
    if (months.length < 2) return null;
    
    const currentIdx = months.indexOf(currentMonth);
    if (currentIdx <= 0) return null;
    
    const current = monthlyBudgets[currentMonth];
    const previous = monthlyBudgets[months[currentIdx - 1]];
    
    const currentExpenses = current.expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0;
    const previousExpenses = previous.expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0;
    
    if (previousExpenses === 0) return null;
    
    const change = ((currentExpenses - previousExpenses) / previousExpenses) * 100;
    
    return {
      current: currentExpenses,
      previous: previousExpenses,
      change,
      isUp: change > 0
    };
  };

  /**
   * Generate smart recommendations based on spending patterns
   */
  const getSmartRecommendations = (trend) => {
    const recommendations = [];
    const stats = calculateAllTimeStats();
    const categoryBreakdown = getCategoryBreakdown();
    
    // Recommendation 1: Savings rate
    const savingsRate = stats.totalIncome > 0 ? (stats.totalSaved / stats.totalIncome) * 100 : 0;
    if (savingsRate < 10) {
      recommendations.push({
        icon: '💡',
        title: 'Boost Your Savings',
        message: `You're saving ${savingsRate.toFixed(1)}% of your income. Try to reach 20% by cutting one category by 10%.`,
        type: 'warning'
      });
    } else if (savingsRate >= 20) {
      recommendations.push({
        icon: '🎉',
        title: 'Great Savings Rate!',
        message: `You're saving ${savingsRate.toFixed(1)}% of your income. You're ahead of the average!`,
        type: 'success'
      });
    }
    
    // Recommendation 2: High spending category
    if (categoryBreakdown.length > 0) {
      const topCategory = categoryBreakdown[0];
      if (topCategory.percentage > 40) {
        recommendations.push({
          icon: '⚠️',
          title: 'High Category Spending',
          message: `${topCategory.name} is ${topCategory.percentage.toFixed(0)}% of your spending. Consider setting a lower limit.`,
          type: 'warning'
        });
      }
    }
    
    // Recommendation 3: Recurring expenses
    let recurringTotal = 0;
    let recurringCount = 0;
    Object.keys(monthlyBudgets).forEach(month => {
      const data = monthlyBudgets[month];
      if (data.expenses) {
        data.expenses.forEach(exp => {
          if (exp.isRecurring) {
            recurringTotal += parseFloat(exp.amount);
            recurringCount++;
          }
        });
      }
    });
    
    if (recurringCount > 0) {
      const avgRecurring = recurringTotal / Object.keys(monthlyBudgets).length;
      recommendations.push({
        icon: '🔄',
        title: 'Recurring Expenses',
        message: `You have ${recurringCount} recurring expenses averaging ${formatCurrency(avgRecurring)}/month. Review subscriptions regularly!`,
        type: 'info'
      });
    }
    
    // Recommendation 4: Spending trend
    if (trend && trend.isUp && trend.change > 15) {
      recommendations.push({
        icon: '📈',
        title: 'Spending Spike Detected',
        message: `Your spending increased ${trend.change.toFixed(0)}% this month. Check if this was planned or needs adjustment.`,
        type: 'warning'
      });
    } else if (trend && !trend.isUp && trend.change < -10) {
      recommendations.push({
        icon: '🎯',
        title: 'Great Progress!',
        message: `You reduced spending by ${Math.abs(trend.change).toFixed(0)}% this month. Keep it up!`,
        type: 'success'
      });
    }
    
    // Recommendation 5: Budget score advice
    if (budgetScore >= 90) {
      recommendations.push({
        icon: '🏆',
        title: 'Budget Master!',
        message: `Your budget score is ${Math.round(budgetScore)}/100. You're doing amazing! Consider investing your savings.`,
        type: 'success'
      });
    } else if (budgetScore < 50) {
      recommendations.push({
        icon: '🎯',
        title: 'Room for Improvement',
        message: `Your budget score is ${Math.round(budgetScore)}/100. Focus on reducing one major expense category this month.`,
        type: 'warning'
      });
    }
    
    return recommendations;
  };

  const stats = calculateAllTimeStats();
  const { best, worst } = getBestWorstMonths();
  const categoryBreakdown = getCategoryBreakdown();
  const topExpenses = getTopExpenses();
  const budgetScore = getBudgetScore();
  const trend = getSpendingTrend();
  
  // Call recommendations AFTER trend is defined
  const recommendations = getSmartRecommendations(trend);

  // Format month string
  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 border-4 border-gray-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-3xl font-bold mb-2">📊 BUDGET INSIGHTS</h2>
        <p className="text-gray-400">Intelligent analysis of your spending patterns</p>
      </div>

      {/* Budget Score */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 border-4 border-purple-700 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">🏆 BUDGET SCORE</h3>
            <p className="text-gray-300 text-sm">Based on your savings rate</p>
          </div>
          <div className="text-6xl font-bold">
            {Math.round(budgetScore)}
            <span className="text-2xl">/100</span>
          </div>
        </div>
        <div className="mt-4 bg-gray-900 h-4 border-2 border-black">
          <div 
            className="h-full transition-all duration-500 bg-gradient-to-r from-green-500 to-blue-500"
            style={{ width: `${budgetScore}%` }}
          />
        </div>
      </div>

      {/* All-Time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-600 border-4 border-green-800 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-sm mb-2 flex items-center gap-2">
            <TrendingUp size={16} />
            TOTAL INCOME
          </div>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalIncome)}</div>
          <div className="text-xs text-green-200 mt-1">
            Avg: {formatCurrency(stats.avgMonthlyIncome)}/mo
          </div>
        </div>

        <div className="bg-red-600 border-4 border-red-800 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-sm mb-2 flex items-center gap-2">
            <TrendingDown size={16} />
            TOTAL EXPENSES
          </div>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
          <div className="text-xs text-red-200 mt-1">
            Avg: {formatCurrency(stats.avgMonthlyExpenses)}/mo
          </div>
        </div>

        <div className={`${stats.totalSaved >= 0 ? 'bg-blue-600 border-blue-800' : 'bg-orange-600 border-orange-800'} border-4 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
          <div className="text-sm mb-2 flex items-center gap-2">
            <Award size={16} />
            TOTAL SAVED
          </div>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalSaved)}</div>
          <div className="text-xs text-blue-200 mt-1">
            {stats.monthCount} months tracked
          </div>
        </div>
      </div>

      {/* Spending Trend */}
      {trend && (
        <div className={`${trend.isUp ? 'bg-orange-900' : 'bg-green-900'} border-4 ${trend.isUp ? 'border-orange-700' : 'border-green-700'} p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
          <div className="flex items-center gap-3">
            {trend.isUp ? (
              <TrendingUp size={32} className="text-orange-400" />
            ) : (
              <TrendingDown size={32} className="text-green-400" />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">
                {trend.isUp ? '📈 SPENDING UP' : '📉 SPENDING DOWN'}
              </h3>
              <p className="text-sm">
                {Math.abs(trend.change).toFixed(1)}% {trend.isUp ? 'increase' : 'decrease'} from last month
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatCurrency(trend.current)}</div>
              <div className="text-xs text-gray-400">was {formatCurrency(trend.previous)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Best & Worst Months */}
      {best && worst && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-900 border-4 border-green-700 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Zap size={20} className="text-yellow-400" />
              BEST MONTH
            </h3>
            <div className="text-2xl font-bold mb-2">{formatMonth(best.month)}</div>
            <div className="text-green-300">Saved: {formatCurrency(best.saved)}</div>
          </div>

          <div className="bg-red-900 border-4 border-red-700 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <AlertCircle size={20} className="text-red-400" />
              NEEDS IMPROVEMENT
            </h3>
            <div className="text-2xl font-bold mb-2">{formatMonth(worst.month)}</div>
            <div className="text-red-300">
              {worst.saved >= 0 ? `Saved: ${formatCurrency(worst.saved)}` : `Over: ${formatCurrency(Math.abs(worst.saved))}`}
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="bg-gray-800 border-4 border-gray-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-xl font-bold mb-4">📊 SPENDING BY CATEGORY</h3>
        <div className="space-y-3">
          {categoryBreakdown.map(cat => (
            <div key={cat.id}>
              <div className="flex justify-between mb-1">
                <span>{cat.name}</span>
                <span className="font-bold">{cat.percentage.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-900 h-6 border-2 border-black">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color
                    }}
                  />
                </div>
                <span className="text-sm font-bold w-24 text-right">{formatCurrency(cat.total)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Expenses */}
      {topExpenses.length > 0 && (
        <div className="bg-gray-800 border-4 border-gray-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xl font-bold mb-4">💸 TOP 5 EXPENSES</h3>
          <div className="space-y-2">
            {topExpenses.map((exp, idx) => (
              <div key={exp.id} className="bg-gray-900 border-2 border-gray-700 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-gray-600">#{idx + 1}</div>
                  <div>
                    <div className="font-bold">{exp.name}</div>
                    <div className="text-xs text-gray-400">{exp.categoryName} • {formatMonth(exp.month)}</div>
                  </div>
                </div>
                <div className="text-xl font-bold">{formatCurrency(exp.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gray-800 border-4 border-gray-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xl font-bold mb-4">🧠 SMART RECOMMENDATIONS</h3>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div 
                key={idx}
                className={`
                  ${rec.type === 'success' ? 'bg-green-900 border-green-700' : ''}
                  ${rec.type === 'warning' ? 'bg-orange-900 border-orange-700' : ''}
                  ${rec.type === 'info' ? 'bg-blue-900 border-blue-700' : ''}
                  border-l-4 p-4
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{rec.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold mb-1">{rec.title}</h4>
                    <p className="text-sm text-gray-300">{rec.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}