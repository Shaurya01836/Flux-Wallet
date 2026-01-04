import React from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const StatCard = ({ label, amount, type, goal, currentMonthlyExpense, onSetGoal }) => (
  <div className="bg-gray-50 rounded-2xl p-6 flex flex-col justify-between h-32 border border-gray-100 relative overflow-hidden group">
    <div className="flex justify-between items-start">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      
      {type === 'expense' && (
        <button onClick={onSetGoal} className="text-[10px] font-bold text-indigo-500 hover:underline">
          {goal > 0 ? 'Edit Budget' : 'Set Budget'}
        </button>
      )}

      <div className={`p-1.5 rounded-full ${type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} ${type === 'expense' ? 'hidden' : ''}`}>
        {type === 'income' ? <FaArrowDown size={10} /> : <FaArrowUp size={10} />}
      </div>
    </div>
    
    <div>
      <p className="text-2xl font-bold text-gray-900">
        {amount.toLocaleString()}
      </p>
      
      {type === 'expense' && goal > 0 && (
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>{Math.round((currentMonthlyExpense / goal) * 100)}% of goal</span>
            <span>{goal.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
            <div 
              // FIX: Changed 'currentMonthExpense' to 'currentMonthlyExpense'
              className={`h-full rounded-full ${currentMonthlyExpense > goal ? 'bg-red-500' : 'bg-indigo-500'}`} 
              style={{ width: `${Math.min((currentMonthlyExpense / goal) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default StatCard;