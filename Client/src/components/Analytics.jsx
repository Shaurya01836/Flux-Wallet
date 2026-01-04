import React, { useMemo } from "react";
import { FaChartPie, FaArrowDown } from "react-icons/fa";

const Analytics = ({ transactions, monthOptions, selectedMonth, setSelectedMonth }) => {
  
  // Calculate Category Stats
  const categoryStats = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'DEBIT');
    const total = expenses.reduce((acc, t) => acc + t.amount, 0);
    
    if (total === 0) return { stats: [], total: 0 };

    const grouped = expenses.reduce((acc, t) => {
        const cat = t.category || "Uncategorized";
        acc[cat] = (acc[cat] || 0) + t.amount;
        return acc;
    }, {});

    const stats = Object.entries(grouped)
        .map(([cat, amount]) => ({ 
            cat, 
            amount, 
            percentage: Math.round((amount / total) * 100) 
        }))
        .sort((a, b) => b.amount - a.amount);

    return { stats, total };
  }, [transactions]);

  return (
    <section>
      {/* Header with Month Filter */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FaChartPie className="text-indigo-600" /> Spending Analytics
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

      {/* Analytics Content */}
      <div className="bg-white p-6 hover:bg-gray-50 rounded-xl">
        {categoryStats.total === 0 ? (
            <div className="text-center py-12 text-gray-400">
                No expenses found in {monthOptions.find(m => m.value === selectedMonth)?.label}.
            </div>
        ) : (
            <div className="space-y-6">
                {/* Total Spent Badge */}
                <div className="text-left mb-8">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Spent</p>
                    <h2 className="text-3xl font-extrabold text-gray-900 mt-1">
                        Rs. {categoryStats.total.toLocaleString()}
                    </h2>
                </div>

                {/* Bars */}
                {categoryStats.stats.map((stat) => (
                    <div key={stat.cat}>
                        <div className="flex justify-between text-sm font-bold text-gray-700 mb-1.5">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                {stat.cat}
                            </span>
                            <span>{stat.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-50 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-gray-900 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${stat.percentage}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-right font-medium">
                            Rs. {stat.amount.toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>
        )}
      </div>
    </section>
  );
};

export default Analytics;