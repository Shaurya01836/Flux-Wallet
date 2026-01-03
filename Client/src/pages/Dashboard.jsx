import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaArrowUp,
  FaArrowDown,
  FaSearch,
  FaBell,
  FaSignOutAlt,
  FaTrashAlt,
  FaPen,       // Added for Edit
  FaBullseye   // Added for Goal
} from "react-icons/fa";
import api from "../api";
import AddTransactionModal from "../components/AddTransactionModal";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null); // Edit State
  const navigate = useNavigate();

  // Data State
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    balance: 0.0,
    income: 0.0,
    expense: 0.0,
  });
  const [user, setUser] = useState(null);

  // --- NEW: Filters & Goals State ---
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Format: YYYY-MM
  const [monthlyGoal, setMonthlyGoal] = useState(0);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user_info"));
    const storedGoal = localStorage.getItem("monthly_goal");

    if (storedUser) {
      setUser(storedUser);
      refreshData(storedUser.id);
    } else {
      navigate("/");
    }

    if (storedGoal) setMonthlyGoal(parseFloat(storedGoal));
  }, []);

  // --- NEW: Filter Logic (Last 1 Year) ---
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return {
            value: d.toISOString().slice(0, 7),
            label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };
    });
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Calculate expense for the selected month for Goal Tracking
  const currentMonthlyExpense = filteredTransactions
    .filter(t => t.type === 'DEBIT')
    .reduce((acc, t) => acc + t.amount, 0);

  const handleLogout = () => {
    if (window.confirm("Log out?")) {
      localStorage.removeItem("user_info");
      localStorage.removeItem("user_token");
      navigate("/");
    }
  };

  const refreshData = async (userId) => {
    try {
      const balanceRes = await api.get(`/api/payments/balance/${userId}`);
      setStats({
        balance: balanceRes.data.balance || 0.0,
        income: balanceRes.data.totalCredit || 0.0,
        expense: balanceRes.data.totalDebit || 0.0,
      });

      const transactionsRes = await api.get(`/api/payments/user/${userId}`);
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error("Error loading dashboard data", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete transaction?")) return;
    try {
      await api.delete(`/api/payments/${id}`);
      refreshData(user.id);
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  // --- NEW: Handle Edit ---
  const handleEdit = (transaction) => {
    setTransactionToEdit(transaction);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setTransactionToEdit(null);
    setIsModalOpen(true);
  };

  // --- NEW: Set Goal ---
  const handleSetGoal = () => {
    const goal = prompt("Enter your monthly budget limit:", monthlyGoal || 0);
    if (goal !== null && !isNaN(goal)) {
        setMonthlyGoal(parseFloat(goal));
        localStorage.setItem("monthly_goal", goal);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <main className="max-w-5xl mx-auto px-6 py-8">
        
        {/* --- Header --- */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-gray-400 text-sm">
              Hello, {user?.name?.split(" ")[0] || "User"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button 
                onClick={handleLogout}
                className="p-2 text-gray-300 hover:text-gray-900 transition" 
                title="Log Out"
            >
                <FaSignOutAlt size={18} />
            </button>
            <div
              onClick={() => navigate("/profile")}
              className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden cursor-pointer hover:ring-2 hover:ring-gray-100 transition"
            >
              {user?.pictureUrl ? (
                <img
                  src={user.pictureUrl}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                  {user?.name?.[0] || "U"}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* --- Balance Section --- */}
        <section className="grid md:grid-cols-3 gap-8 mb-16">
            
            {/* Total Balance (Large) */}
            <div className="md:col-span-1 flex flex-col justify-center">
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Balance</p>
                <h2 className="text-5xl font-extrabold text-gray-900 tracking-tight">
                    Rs.{stats.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h2>
                <div className="mt-8 flex gap-4">
                    <button 
                        onClick={handleAdd}
                        className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-black transition flex items-center gap-2"
                    >
                        <FaPlus size={12} /> Add New
                    </button>
                </div>
            </div>

            {/* Stats (Cards) */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <StatCard 
                    label="Income" 
                    amount={stats.income} 
                    type="income" 
                />
                <StatCard 
                    label="Expense" 
                    amount={stats.expense} // Show total expense
                    type="expense" 
                    // Pass goal props to the Expense Card only
                    goal={monthlyGoal}
                    currentMonthExpense={currentMonthlyExpense}
                    onSetGoal={handleSetGoal}
                />
            </div>
        </section>

        {/* --- Transactions List --- */}
        <section>
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                
                {/* --- NEW: Month Filter Dropdown --- */}
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
                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        No transactions found in {monthOptions.find(m => m.value === selectedMonth)?.label}.
                    </div>
                ) : (
                    filteredTransactions.map((t) => (
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
                                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(t.date)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <span className={`font-bold tabular-nums ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-gray-900'}`}>
                                    {t.type === 'CREDIT' ? '+' : '-'} {t.amount.toLocaleString()}
                                </span>
                             
                                <div className="flex gap-2 ">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleEdit(t); }}
                                        className="text-gray-300 hover:text-indigo-600 p-2"
                                        title="Edit"
                                    >
                                        <FaPen size={12} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
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

      </main>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionAdded={() => refreshData(user.id)}
        transactionToEdit={transactionToEdit} // Pass the transaction to edit
      />
    </div>
  );
};

// --- Updated StatCard to handle Goal Visualization ---
const StatCard = ({ label, amount, type, goal, currentMonthExpense, onSetGoal }) => (
    <div className="bg-gray-50 rounded-2xl p-6 flex flex-col justify-between h-32 border border-gray-100 relative overflow-hidden group">
        <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
            
            {/* Goal Button (Only for Expense) */}
            {type === 'expense' && (
                <button onClick={onSetGoal} className="text-[10px] font-bold text-indigo-500 hover:underline opacity-0 group-hover:opacity-100 transition">
                    {goal > 0 ? 'Edit Goal' : 'Set Goal'}
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
            
            {/* Goal Progress Bar (Only for Expense) */}
            {type === 'expense' && goal > 0 && (
                <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>{Math.round((currentMonthExpense / goal) * 100)}% of goal</span>
                        <span>{goal.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${currentMonthExpense > goal ? 'bg-red-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${Math.min((currentMonthExpense / goal) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    </div>
);

export default Dashboard;