// src/components/CalendarView.js
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Calendar as CalendarIcon } from 'lucide-react';

const CalendarView = ({ expenses, formatCurrency, categories, currentMonth }) => {
  const { theme } = useTheme();
  const [hoveredDay, setHoveredDay] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Parse currentMonth (YYYY-MM format)
  const [year, month] = currentMonth.split('-').map(Number);

  // Get days in month
  const getDaysInMonth = () => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  // Get bills for a specific date
  const getBillsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return expenses.filter(expense => {
      if (!expense.dueDate) return false;
      return expense.dueDate === dateStr;
    });
  };

  // Handle mouse enter on day cell
  const handleMouseEnter = (day, bills, event) => {
    if (bills.length === 0) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.right + 8, // 8px to the right of the cell
      y: rect.top
    });
    setHoveredDay({ day, bills });
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Create array of days
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div 
      className="border-4 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <CalendarIcon size={24} style={{ color: theme.colors.accent }} />
        <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>
          {monthName}
        </h3>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div 
            key={day} 
            className="text-center font-bold text-sm p-2"
            style={{ color: theme.colors.textSecondary }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const date = new Date(year, month - 1, day);
          date.setHours(0, 0, 0, 0);
          const bills = getBillsForDate(date);
          const isToday = date.getTime() === today.getTime();
          const isPast = date < today;
          const hasBills = bills.length > 0;
          const hasOverdueBills = isPast && hasBills;

          let bgColor = theme.colors.secondary;
          let borderColor = theme.colors.border;
          
          if (isToday) {
            borderColor = theme.colors.accent;
          }
          
          if (hasOverdueBills) {
            bgColor = `${theme.colors.error}30`;
            borderColor = theme.colors.error;
          } else if (hasBills) {
            bgColor = `${theme.colors.warning}20`;
            borderColor = theme.colors.warning;
          }

          return (
            <div
              key={day}
              className="aspect-square border-2 p-1 relative hover:scale-105 transition-all cursor-pointer"
              style={{
                backgroundColor: bgColor,
                borderColor: borderColor
              }}
              onMouseEnter={(e) => handleMouseEnter(day, bills, e)}
              onMouseLeave={handleMouseLeave}
            >
              <div 
                className="text-sm font-bold"
                style={{ 
                  color: isToday ? theme.colors.accent : theme.colors.text 
                }}
              >
                {day}
              </div>
              
              {hasBills && (
                <div className="absolute bottom-1 left-1 right-1">
                  <div className="flex gap-0.5 flex-wrap justify-center">
                    {bills.slice(0, 3).map((bill, idx) => {
                      const category = categories.find(c => c.id === bill.category);
                      return (
                        <div
                          key={idx}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: category?.color || theme.colors.accent }}
                          title={`${bill.name}: ${formatCurrency(bill.amount)}`}
                        />
                      );
                    })}
                  </div>
                  {bills.length > 3 && (
                    <div 
                      className="text-xs text-center font-bold mt-0.5"
                      style={{ color: theme.colors.text }}
                    >
                      +{bills.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Portal-based Tooltip - Rendered outside the component tree! */}
      {hoveredDay && createPortal(
        <div
          className="fixed p-3 border-2 rounded-lg shadow-2xl min-w-[220px] pointer-events-none"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.accent,
            color: theme.colors.text,
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            zIndex: 999999,
            transform: 'translateZ(0)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
          }}
        >
          <div className="font-bold text-sm mb-2 border-b pb-1" style={{ borderColor: theme.colors.border }}>
            📅 Bills on {monthName.split(' ')[0]} {hoveredDay.day}:
          </div>
          {hoveredDay.bills.map((bill, idx) => {
            const category = categories.find(c => c.id === bill.category);
            return (
              <div key={idx} className="text-xs mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: category?.color || theme.colors.accent }}
                  />
                  {bill.name}
                </span>
                <span className="font-bold">{formatCurrency(bill.amount)}</span>
                {bill.paid && <span className="ml-2 text-green-500">✓</span>}
              </div>
            );
          })}
          <div className="mt-2 pt-2 border-t text-xs font-bold" style={{ borderColor: theme.colors.border }}>
            Total: {formatCurrency(hoveredDay.bills.reduce((sum, bill) => sum + bill.amount, 0))}
          </div>
        </div>,
        document.body // Render directly to body, bypassing all parent containers!
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t-2" style={{ borderColor: theme.colors.border }}>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 border-2"
              style={{ 
                borderColor: theme.colors.accent,
                backgroundColor: theme.colors.secondary
              }}
            />
            <span style={{ color: theme.colors.textSecondary }}>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 border-2"
              style={{ 
                borderColor: theme.colors.warning,
                backgroundColor: `${theme.colors.warning}20`
              }}
            />
            <span style={{ color: theme.colors.textSecondary }}>Bills Due</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 border-2"
              style={{ 
                borderColor: theme.colors.error,
                backgroundColor: `${theme.colors.error}30`
              }}
            />
            <span style={{ color: theme.colors.textSecondary }}>Overdue</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;