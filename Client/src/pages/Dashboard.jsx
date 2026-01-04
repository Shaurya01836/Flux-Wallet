import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import AddTransactionModal from "../components/AddTransactionModal";

// Import components
import DashboardHeader from "../components/DashboardHeader";
import BalanceSection from "../components/BalanceSection";
import StatCard from "../components/StatCard";
import TransactionList from "../components/TransactionList";
import Analytics from "../components/Analytics"; 

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null); 
  const [activeTab, setActiveTab] = useState('activity'); 
  const navigate = useNavigate();

  // Data State
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    balance: 0.0,
    income: 0.0,
    expense: 0.0,
  });
  const [user, setUser] = useState(null);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [monthlyGoal, setMonthlyGoal] = useState(0);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user_info"));
    if (storedUser) {
      setUser(storedUser);
      // We don't call refreshData here anymore, 
      // the second useEffect will handle it since selectedMonth is set initially.
    } else {
      navigate("/");
    }
  }, []);

  // --- TRIGGER DATA REFRESH WHEN MONTH OR USER CHANGES ---
  useEffect(() => {
    if (user && selectedMonth) {
        fetchBudget(user.id, selectedMonth);
        refreshData(user.id, selectedMonth); // <--- Pass Month Here
    }
  }, [user, selectedMonth]);

  const fetchBudget = async (userId, month) => {
    try {
        const response = await api.get(`/api/user/${userId}?month=${month}`);
        setMonthlyGoal(response.data.amount || 0);
    } catch (error) {
        console.error("Failed to fetch budget", error);
        setMonthlyGoal(0);
    }
  };

  const refreshData = async (userId, month) => {
    try {
      // --- UPDATE: Send Month to Backend ---
      const balanceRes = await api.get(`/api/payments/balance/${userId}?month=${month}`);
      
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

  const handleSetGoal = async () => {
    const currentGoal = monthlyGoal === 0 ? "" : monthlyGoal;
    const goalInput = prompt("Enter your monthly budget limit:", currentGoal);
    
    if (goalInput !== null && !isNaN(goalInput) && goalInput.trim() !== "") {
        const newGoal = parseFloat(goalInput);
        try {
            await api.post('/api/user/budget', {
                amount: newGoal,
                month: selectedMonth,
                user_id: user.id 
            });
            setMonthlyGoal(newGoal); 
        } catch (error) {
            console.error("Failed to set budget", error);
            alert("Failed to save budget.");
        }
    }
  };

  // Filter Logic
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

  const handleDelete = async (id) => {
    if (!window.confirm("Delete transaction?")) return;
    try {
      await api.delete(`/api/payments/${id}`);
      refreshData(user.id, selectedMonth); // Pass month here too
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleEdit = (transaction) => {
    setTransactionToEdit(transaction);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setTransactionToEdit(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <main className="max-w-5xl mx-auto px-6 py-8">
        
        <DashboardHeader 
          user={user} 
          onLogout={handleLogout} 
          onNavigateProfile={() => navigate("/profile")} 
        />

        <section className="grid md:grid-cols-3 gap-8 mb-10">
            <BalanceSection 
              balance={stats.balance} 
              onAdd={handleAdd} 
            />
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <StatCard 
                    label="Income" 
                    amount={stats.income} 
                    type="income" 
                />
                <StatCard 
                    label="Expense" 
                    amount={stats.expense} 
                    type="expense" 
                    goal={monthlyGoal}
                    currentMonthlyExpense={currentMonthlyExpense}
                    onSetGoal={handleSetGoal}
                />
            </div>
        </section>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 bg-gray-50 p-1 rounded-xl w-fit">
            <button 
                onClick={() => setActiveTab('activity')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'activity' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Activity
            </button>
            <button 
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'analytics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Analytics
            </button>
        </div>

        {/* Conditional Rendering */}
        {activeTab === 'activity' ? (
            <TransactionList 
              transactions={filteredTransactions}
              monthOptions={monthOptions}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
        ) : (
            <Analytics 
              transactions={filteredTransactions}
              monthOptions={monthOptions}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
        )}

      </main>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionAdded={() => refreshData(user.id, selectedMonth)} 
        transactionToEdit={transactionToEdit} 
      />
    </div>
  );
};

export default Dashboard;