import React, { useMemo } from "react";
import { FaArrowDown, FaChartPie, FaBolt, FaCalendarAlt, FaFire, FaTrophy } from "react-icons/fa";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Analytics = ({
  transactions,
  monthOptions,
  selectedMonth,
  setSelectedMonth,
}) => {
  // --- 1. Calculate Stats ---
  const expenses = useMemo(() => transactions.filter((t) => t.type === "DEBIT"), [transactions]);
  
  const categoryStats = useMemo(() => {
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
        percentage: Math.round((amount / total) * 100),
      }))
      .sort((a, b) => b.amount - a.amount);

    return { stats, total };
  }, [expenses]);

  // --- 2. Advanced Insights ---
  const insights = useMemo(() => {
    if (expenses.length === 0) return null;
    
    const maxTxn = Math.max(...expenses.map(t => t.amount));
    const highestCategory = categoryStats.stats[0]?.cat || "None";
    
    const [year, month] = selectedMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // If it's the current month, only calculate average up to today for better accuracy
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === parseInt(year) && (today.getMonth() + 1) === parseInt(month);
    const daysPassed = isCurrentMonth ? today.getDate() : daysInMonth;
    
    const avgDaily = categoryStats.total / (daysPassed || 1);

    return { maxTxn, highestCategory, avgDaily, totalCount: expenses.length };
  }, [expenses, categoryStats, selectedMonth]);

  // --- 3. Daily Trend Chart ---
  const dailySpend = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const grouped = expenses.reduce((acc, t) => {
      const day = new Date(t.date).getDate();
      acc[day] = (acc[day] || 0) + t.amount;
      return acc;
    }, {});
    
    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      amount: grouped[i + 1] || 0
    }));
  }, [expenses, selectedMonth]);

  const maxDailySpend = Math.max(...dailySpend.map(d => d.amount), 1); // Avoid div by 0

  // --- 4. Premium Color Palette ---
  const COLORS = [
    "#4F46E5", // Indigo
    "#EC4899", // Pink
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#8B5CF6", // Violet
    "#06B6D4", // Cyan
    "#6B7280", // Gray (Others)
  ];

  // Removed manual gradient generation (handled by Recharts now)

  return (
    <section className="pb-10 animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FaChartPie className="text-indigo-600" /> Analytics
        </h3>

        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-transparent outline-none cursor-pointer hover:text-gray-800 transition appearance-none pr-4"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FaArrowDown
            className="absolute right-0 top-0.5 text-gray-400 pointer-events-none"
            size={10}
          />
        </div>
      </div>

      {categoryStats.total === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-4 shadow-inner">
            <FaChartPie size={24} />
          </div>
          <p className="text-gray-900 font-bold text-lg mb-1">No insights available</p>
          <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
            Analytics will automatically generate once you add some expenses for this month.
          </p>
        </div>
      ) : (
        <>
          {/* Insights Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
                <FaFire size={12} />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Highest Spend</p>
              <p className="text-lg font-extrabold text-gray-900 truncate">{insights.highestCategory}</p>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
                <FaTrophy size={12} />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Largest Trans.</p>
              <p className="text-lg font-extrabold text-gray-900 truncate">Rs.{insights.maxTxn.toLocaleString()}</p>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow col-span-2 md:col-span-1">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
                <FaCalendarAlt size={12} />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Daily Avg.</p>
              <p className="text-lg font-extrabold text-gray-900 truncate">Rs.{Math.round(insights.avgDaily).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            {/* --- Left: The Donut Chart (Recharts) --- */}
            <div className="relative w-48 h-48 md:w-56 md:h-56 flex-shrink-0 flex items-center justify-center">
              {/* Render text underneath the SVG so tooltips display on top */}
              <div className="absolute inset-[18%] md:inset-[20%] bg-white rounded-full flex flex-col items-center justify-center shadow-inner pointer-events-none">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                  Total Spent
                </span>
                <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                  Rs.{(categoryStats.total > 1000 ? (categoryStats.total / 1000).toFixed(1) + 'k' : categoryStats.total)}
                </span>
                <span className="text-[10px] text-gray-300 font-medium mt-1">
                  {expenses.length} txns
                </span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats.stats}
                    innerRadius="75%"
                    outerRadius="100%"
                    paddingAngle={2}
                    dataKey="amount"
                    stroke="none"
                  >
                    {categoryStats.stats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `Rs.${value}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    itemStyle={{ color: '#111827' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* --- Right: Detailed List --- */}
            <div className="flex-1 w-full space-y-5">
              {categoryStats.stats.map((stat, index) => {
                const color = COLORS[index % COLORS.length];
                return (
                  <div key={stat.cat} className="group cursor-default">
                    <div className="flex justify-between items-end mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: color }}
                        ></div>
                        <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
                          {stat.cat}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-gray-900">
                          {stat.percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                        style={{ width: `${stat.percentage}%`, backgroundColor: color }}
                      >
                        <div className="absolute top-0 left-0 bottom-0 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full animate-shimmer"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Trend Chart (Recharts) */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm mt-4">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-6">Daily Spending Trend</h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySpend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
                    tickFormatter={(val) => {
                      if (val === 1) return '1st';
                      if (val === 15) return '15th';
                      if (val === dailySpend.length) return 'End';
                      return '';
                    }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
                    tickFormatter={(val) => val === 0 ? '' : `Rs.${val}`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    formatter={(value) => [`Rs.${value}`, 'Spent']}
                    labelFormatter={(label) => `Day ${label}`}
                    itemStyle={{ color: '#111827' }}
                  />
                  <Bar dataKey="amount" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default Analytics;
