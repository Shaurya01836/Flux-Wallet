import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaBullseye, FaBolt } from "react-icons/fa";
import api from "../api";
import AddTransactionModal from "../components/AddTransactionModal";
import DashboardHeader from "../components/DashboardHeader";
import TransactionList from "../components/Transaction";
import Analytics from "../components/Analytics";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [activeTab, setActiveTab] = useState('activity');
  const navigate = useNavigate();
  const [isServerWaking, setIsServerWaking] = useState(true);

  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    balance: 0.0,
    income: 0.0,
    expense: 0.0,
  });
  const [user, setUser] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyGoal, setMonthlyGoal] = useState(0);


  useEffect(() => {
    const initDashboard = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user_info"));
      if (!storedUser) {
        navigate("/");
        return;
      }
      setUser(storedUser);

   
      try {
        await api.get("/health-check");
      } catch (error) {
        console.error("Server wake-up ping failed (or server already awake)", error);
      } finally {
        setIsServerWaking(false); 
      }
    };

    initDashboard();
  }, []);


  useEffect(() => {
    if (user && selectedMonth) {
      fetchBudget(user.id, selectedMonth);
      refreshData(user.id, selectedMonth);
    }
  }, [user, selectedMonth]);

  

  const fetchBudget = async (userId, month) => {
    try {
      const response = await api.get(`/api/user/${userId}?month=${month}`);
      setMonthlyGoal(response.data.amount || 0);
    } catch (error) {
      console.error(error);
      setMonthlyGoal(0);
    }
  };

  const refreshData = async (userId, month) => {
    try {
      const balanceRes = await api.get(`/api/payments/balance/${userId}?month=${month}`);
      
      const income = balanceRes.data.monthlyCredit || 0.0;
      const expense = balanceRes.data.monthlyDebit || 0.0;

      setStats({
        balance: income - expense,
        income: income,
        expense: expense,
      });

      const transactionsRes = await api.get(`/api/payments/user/${userId}`);
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error(error);
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
        console.error(error);
        alert("Failed to save budget.");
      }
    }
  };

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
      refreshData(user.id, selectedMonth);
    } catch (error) {
      console.error(error);
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

  const remaining = monthlyGoal - stats.expense;
  const percentage = monthlyGoal > 0 ? Math.round((stats.expense / monthlyGoal) * 100) : 0;

  if (isServerWaking) {
      return (
          <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <FaBolt size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Connecting to Server...</h2>
              <p className="text-sm text-gray-500 max-w-xs">
                  This may take up to 60 seconds if the server was sleeping. Please wait.
              </p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 font-sans text-gray-900">
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        
        <DashboardHeader 
          user={user} 
          onLogout={handleLogout} 
          onNavigateProfile={() => navigate("/profile")} 
        />

        <section className="mb-8 md:mb-10">
          <div className="rounded-3xl p-6 md:p-8 border border-gray-100 shadow-lg shadow-gray-100/50 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
             
             <div className="w-full text-left">
                <h1 className={`text-4xl md:text-6xl font-extrabold tracking-tight mb-2 ${monthlyGoal > 0 && remaining < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                   Rs. {monthlyGoal > 0 ? remaining.toLocaleString() : stats.balance.toLocaleString()}
                </h1>
                
                <div className="flex items-start md:items-center gap-3 text-sm font-bold text-gray-500">
                   <span className={percentage > 100 ? "text-red-500" : "text-indigo-600"}>
                      {monthlyGoal > 0 ? `${percentage}% Used` : "Net Balance"}
                   </span>
                   
                   {monthlyGoal > 0 && (
                       <>
                         <span className="text-gray-300">|</span>
                         <span>Goal: {monthlyGoal.toLocaleString()}</span>
                       </>
                   )}
                </div>
             </div>

             <div className="w-full md:w-auto min-w-50 flex flex-col gap-4">
                <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-400 font-bold uppercase text-xs">Income</span>
                   <span className="font-bold text-gray-900">Rs. {stats.income.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-400 font-bold uppercase text-xs">Expense</span>
                   <span className="font-bold text-gray-900">Rs. {stats.expense.toLocaleString()}</span>
                </div>

                <div className="h-px bg-gray-100 my-1"></div>

                <button 
                   onClick={handleSetGoal}
                   className="text-xs font-bold text-indigo-600 hover:text-indigo-800 text-right uppercase tracking-wide transition"
                >
                   {monthlyGoal > 0 ? "Edit Goal" : "Set Goal"}
                </button>
             </div>

          </div>
        </section>

        <div className="flex justify-between items-center mb-6">
            <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm w-full md:w-auto">
                <button 
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition ${activeTab === 'activity' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                    Activity
                </button>
                <button 
                    onClick={() => setActiveTab('analytics')}
                    className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition ${activeTab === 'analytics' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                    Analytics
                </button>
            </div>

            <button 
                onClick={handleAdd}
                className="hidden md:flex bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition items-center gap-2 shadow-lg shadow-gray-200"
            >
                <FaPlus size={12} /> Add Transaction
            </button>
        </div>

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

      <div className="fixed bottom-8 right-8 z-40 md:hidden">
            <button 
                onClick={handleAdd}
                className="bg-gray-900 text-white p-4 rounded-full shadow-xl hover:bg-black transition active:scale-95"
            >
                <FaPlus size={20} /> 
            </button>
      </div>

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