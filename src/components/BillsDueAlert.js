// src/components/BillsDueAlert.js
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';

const BillsDueAlert = ({ billsDueThisWeek, overdueBills, formatCurrency, formatDate }) => {
  const { theme } = useTheme();

  // Don't show banner if no bills due
  if (billsDueThisWeek.length === 0 && overdueBills.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Overdue Bills Alert - Red */}
      {overdueBills.length > 0 && (
        <div 
          className="border-4 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-pulse"
          style={{
            backgroundColor: `${theme.colors.error}20`,
            borderColor: theme.colors.error
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={24} style={{ color: theme.colors.error }} className="animate-bounce" />
            <h3 className="text-lg font-bold" style={{ color: theme.colors.error }}>
              🚨 OVERDUE BILLS ({overdueBills.length})
            </h3>
          </div>
          
          <div className="space-y-2">
            {overdueBills.map(bill => (
              <div 
                key={bill.id} 
                className="p-3 border-2 flex items-center justify-between"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.error,
                  color: theme.colors.text
                }}
              >
                <div>
                  <div className="font-bold">{bill.name}</div>
                  <div className="text-sm flex items-center gap-2" style={{ color: theme.colors.error }}>
                    <Clock size={14} />
                    <span>Due: {formatDate(bill.dueDate)}</span>
                  </div>
                </div>
                <div className="font-bold text-lg" style={{ color: theme.colors.text }}>
                  {formatCurrency(bill.amount)}
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-sm mt-3" style={{ color: theme.colors.error }}>
            ⚠️ These bills are past their due date. Pay them as soon as possible!
          </p>
        </div>
      )}

      {/* Bills Due This Week - Yellow */}
      {billsDueThisWeek.length > 0 && (
        <div 
          className="border-4 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          style={{
            backgroundColor: `${theme.colors.warning}20`,
            borderColor: theme.colors.warning
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={24} style={{ color: theme.colors.warning }} />
            <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>
              📅 BILLS DUE THIS WEEK ({billsDueThisWeek.length})
            </h3>
          </div>
          
          <div className="space-y-2">
            {billsDueThisWeek.map(bill => {
              const daysUntilDue = Math.ceil((new Date(bill.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
              
              return (
                <div 
                  key={bill.id} 
                  className="p-3 border-2 flex items-center justify-between"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                >
                  <div>
                    <div className="font-bold">{bill.name}</div>
                    <div className="text-sm flex items-center gap-2" style={{ color: theme.colors.warning }}>
                      <Clock size={14} />
                      <span>
                        {daysUntilDue === 0 
                          ? 'Due TODAY' 
                          : daysUntilDue === 1
                          ? 'Due tomorrow'
                          : `Due in ${daysUntilDue} days`
                        } - {formatDate(bill.dueDate)}
                      </span>
                    </div>
                  </div>
                  <div className="font-bold text-lg" style={{ color: theme.colors.text }}>
                    {formatCurrency(bill.amount)}
                  </div>
                </div>
              );
            })}
          </div>
          
          <p className="text-sm mt-3" style={{ color: theme.colors.textSecondary }}>
            💡 Don't forget to pay these bills on time!
          </p>
        </div>
      )}
    </div>
  );
};

export default BillsDueAlert;