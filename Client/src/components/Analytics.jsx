import React, { useMemo } from "react";
import { FaArrowDown, FaChartPie, FaFilter, FaLayerGroup } from "react-icons/fa";

const Analytics = ({
  transactions,
  monthOptions,
  selectedMonth,
  setSelectedMonth,
}) => {
  // --- 1. Calculate Stats ---
  const categoryStats = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "DEBIT");
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
  }, [transactions]);

  // --- 2. Premium Color Palette ---
  const COLORS = [
    "#4F46E5", // Indigo
    "#EC4899", // Pink
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#8B5CF6", // Violet
    "#06B6D4", // Cyan
    "#6B7280", // Gray (Others)
  ];

  // --- 3. Dynamic Conic Gradient for Donut Chart ---
  const gradientString = useMemo(() => {
    if (categoryStats.total === 0) return "conic-gradient(#f3f4f6 0% 100%)";

    let currentDeg = 0;
    const stops = categoryStats.stats
      .map((stat, index) => {
        const color = COLORS[index % COLORS.length];
        const deg = (stat.amount / categoryStats.total) * 360;
        const start = currentDeg;
        const end = currentDeg + deg;
        currentDeg = end;
        return `${color} ${start}deg ${end}deg`;
      })
      .join(", ");

    return `conic-gradient(${stops})`;
  }, [categoryStats]);

  return (
    <section className="pb-10 animate-fade-in">
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
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
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-4">
            <FaChartPie size={24} />
          </div>
          <p className="text-gray-900 font-bold text-sm">No expenses yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Transactions will appear here once you start spending.
          </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
          {/* --- Left: The Donut Chart --- */}
          <div className="relative w-64 h-64 flex-shrink-0">
            {/* Gradient Ring */}
            <div
              className="w-full h-full rounded-full shadow-2xl shadow-gray-100 transform -rotate-90"
              style={{ background: gradientString }}
            ></div>

            {/* Center Hole */}
            <div className="absolute inset-5 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                Total Spent
              </span>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                Rs.{(categoryStats.total / 1000).toFixed(1)}k
              </span>
              <span className="text-[10px] text-gray-300 font-medium mt-1">
                {
                  monthOptions
                    .find((m) => m.value === selectedMonth)
                    ?.label.split(" ")[0]
                }
              </span>
            </div>
          </div>

          {/* --- Right: Detailed List --- */}
          <div className="flex-1 w-full space-y-6">
            {categoryStats.stats.map((stat, index) => {
              const color = COLORS[index % COLORS.length];
              return (
                <div key={stat.cat} className="group cursor-default">
                  {/* Label Row */}
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-[5px] shadow-sm ring-1 ring-black/5"
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

                  {/* Premium Progress Bar */}
                  <div className="relative w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                      style={{
                        width: `${stat.percentage}%`,
                        backgroundColor: color,
                      }}
                    >
                      {/* Subtle Shine Effect */}
                      <div className="absolute top-0 left-0 bottom-0 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full animate-shimmer"></div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mt-1.5 text-right font-medium">
                    Rs. {stat.amount.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default Analytics;
