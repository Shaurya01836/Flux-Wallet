import React, { useMemo } from "react";
import { FaArrowUp, FaArrowDown, FaPen, FaTrashAlt, FaInbox, } from "react-icons/fa";
import { FaMoneyBillTransfer } from "react-icons/fa6";

const Transaction = ({ 
  transactions, 
  monthOptions, 
  selectedMonth, 
  setSelectedMonth, 
  onEdit, 
  onDelete 
}) => {

  
  const groupedTransactions = useMemo(() => {
    const groups = {};
    transactions.forEach((t) => {
      const dateKey = new Date(t.date).toDateString(); 
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [transactions]);

  const getDateLabel = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" });
  };

  return (
    <section className="relative pb-12">
      
    
     <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaMoneyBillTransfer className="text-indigo-600" /> Transactions
            </h3>
            
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
    

      {/* --- Timeline Content --- */}
      <div className="space-y-0 relative">
        {/* Vertical Timeline Line (Background) */}
        {transactions.length > 0 && (
            <div className="absolute left-4 top-4 bottom-0 w-px bg-gray-100 hidden md:block"></div>
        )}

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 mb-6 shadow-inner">
               <FaInbox size={30} />
            </div>
            <p className="text-gray-900 font-bold text-lg">No activity yet</p>
            <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto">
               We couldn't find any transactions for this month.
            </p>
          </div>
        ) : (
          groupedTransactions.map(([dateKey, groupItems]) => (
            <div key={dateKey} className="relative mb-8 last:mb-0">
              
              {/* Sticky Date Label */}
              <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm py-3 mb-2 flex items-center gap-4">
                 {/* Timeline Dot */}
                 <div className="w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-gray-50 hidden md:block relative z-20 ml-[13px]"></div>
                 
                 <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-200/50 px-3 py-1 rounded-md">
                   {getDateLabel(dateKey)}
                 </h4>
              </div>

              {/* Transactions List */}
              <div className="md:ml-12 space-y-3">
                {groupItems.map((t) => (
                  <div 
                    key={t.id} 
                    className="group relative bg-white rounded-2xl p-4 flex items-center justify-between border border-transparent hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 cursor-default"
                  >
                    
                    {/* Left: Icon & Text */}
                    <div className="flex items-center gap-4">
                      <div 
                        className={`
                          w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-transform group-hover:scale-105
                          ${t.type === 'CREDIT' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-indigo-50 text-indigo-600'}
                        `}
                      >
                        {t.type === 'CREDIT' ? <FaArrowDown size={14} /> : <FaArrowUp size={14} />}
                      </div>
                      
                      <div>
                        <p className="font-bold text-gray-900 text-sm leading-tight group-hover:text-indigo-900 transition-colors">
                            {t.title}
                        </p>
                        <p className="text-xs text-gray-400 font-medium mt-1">
                           {t.category || "General"}
                           {t.description && <span className="hidden sm:inline opacity-70"> — {t.description}</span>}
                        </p>
                      </div>
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="flex items-center gap-6">
                        <span 
                            className={`font-extrabold text-sm tracking-tight tabular-nums
                                ${t.type === 'CREDIT' ? 'text-emerald-500' : 'text-gray-900'}
                            `}
                        >
                            {t.type === 'CREDIT' ? '+' : '-'} {t.amount.toLocaleString()}
                        </span>

                        {/* Actions (Slide in on hover for Desktop) */}
                        <div className="flex gap-1 md:w-0 md:overflow-hidden md:opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 ease-out">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(t); }}
                                className="p-2 text-gray-300 hover:text-indigo-600 transition hover:bg-indigo-50 rounded-lg"
                                title="Edit"
                            >
                                <FaPen size={12} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                                className="p-2 text-gray-300 hover:text-rose-500 transition hover:bg-rose-50 rounded-lg"
                                title="Delete"
                            >
                                <FaTrashAlt size={12} />
                            </button>
                        </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default Transaction;