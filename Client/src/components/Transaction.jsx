import React from "react";
import { FaArrowUp, FaArrowDown, FaPen, FaTrashAlt } from "react-icons/fa";

const Transaction = ({ 
  transactions, 
  monthOptions, 
  selectedMonth, 
  setSelectedMonth, 
  onEdit, 
  onDelete 
}) => {

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
        
        {/* Month Filter Dropdown */}
        <div className="relative">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-transparent outline-none cursor-pointer hover:text-gray-800 transition appearance-none pr-4"
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FaArrowDown className="absolute right-0 top-0.5 text-gray-400 pointer-events-none" size={10} />
        </div>
      </div>

      <div className="space-y-2">
        {transactions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            No transactions found in {monthOptions.find(m => m.value === selectedMonth)?.label}.
          </div>
        ) : (
          transactions.map((t) => (
            <div 
              key={t.id} 
              className="group flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100 cursor-default"
            >
              <div className="flex items-center gap-5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${t.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {t.type === 'CREDIT' ? <FaArrowDown /> : <FaArrowUp />}
                </div>
                
                <div>
                  <p className="font-bold text-gray-900">{t.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 font-medium">
                      {t.category || "Uncategorized"} • {formatDate(t.date)}
                    </span>
                  </div>
                  {t.description && (
                    <p className="text-[10px] text-gray-400 mt-0.5 italic max-w-[200px] truncate">
                      {t.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className={`font-bold tabular-nums ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-gray-900'}`}>
                  {t.type === 'CREDIT' ? '+' : '-'} {t.amount.toLocaleString()}
                </span>
                
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(t); }}
                    className="text-gray-300 hover:text-indigo-600 p-2"
                    title="Edit"
                  >
                    <FaPen size={12} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                    className="text-gray-300 hover:text-red-500 p-2"
                    title="Delete"
                  >
                    <FaTrashAlt size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default Transaction;