import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaArrowUp, FaArrowDown, FaWallet, FaServer } from "react-icons/fa";
import api from "../api";
import AddTransactionModal from "../components/AddTransactionModal";
import DashboardHeader from "../components/DashboardHeader";
import TransactionList from "../components/Transaction";
import Analytics from "../components/Analytics";

const Dashboard = () => {
  const navigate = useNavigate();
  
  // --- State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [activeTab, setActiveTab] = useState('activity');
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ balance: 0.0, income: 0.0, expense: 0.0 });
  const [user, setUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyGoal, setMonthlyGoal] = useState(0);
  
  // --- Loading States ---
  const [isLoading, setIsLoading] = useState(true);
  const [isServerWaking, setIsServerWaking] = useState(true); // <--- RESTORED THIS

  // --- Init & Server Wake-up ---
  useEffect(() => {
    const initDashboard = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user_info"));
      if (!storedUser) {
        navigate("/");
        return;
      }
      setUser(storedUser);

      // 1. Wake up the server
      try {
        console.log("Pinging server...");
        await api.get("/health-check"); // This request will "hang" until server wakes
      } catch (error) {
        console.warn("Server wake-up ping finished (or failed), proceeding...", error);
      } finally {
        // 2. Once response comes back (or fails), we know server is awake
        setIsServerWaking(false);
        setIsLoading(false);
      }
    };
    initDashboard();
  }, [navigate]);

  // --- Data Fetching (Only runs after server is awake) ---
  useEffect(() => {
    if (!isServerWaking && user && selectedMonth) {
      fetchBudget(user.id, selectedMonth);
      refreshData(user.id, selectedMonth);
    }
  }, [isServerWaking, user, selectedMonth]);

  const fetchBudget = async (uid, m) => {
    try {
      const res = await api.get(`/api/user/${uid}?month=${m}`);
      setMonthlyGoal(res.data.amount || 0);
    } catch { setMonthlyGoal(0); }
  };

  const refreshData = async (uid, m) => {
    try {
      const bal = await api.get(`/api/payments/balance/${uid}?month=${m}`);
      setStats({
        balance: (bal.data.monthlyCredit || 0) - (bal.data.monthlyDebit || 0),
        income: bal.data.monthlyCredit || 0,
        expense: bal.data.monthlyDebit || 0,
      });
      const txs = await api.get(`/api/payments/user/${uid}`);
      setTransactions(txs.data);
    } catch (e) { console.error(e); }
  };

  const handleSetGoal = async () => {
    const val = prompt("Monthly budget:", monthlyGoal || "");
    if (val && !isNaN(val)) {
      try {
        await api.post('/api/user/budget', { amount: parseFloat(val), month: selectedMonth, user_id: user.id });
        setMonthlyGoal(parseFloat(val));
      } catch { alert("Error saving budget"); }
    }
  };

  // --- Calculations ---
  const remaining = monthlyGoal - stats.expense;
  const pct = monthlyGoal > 0 ? Math.min(Math.round((stats.expense / monthlyGoal) * 100), 100) : 0;
  const isOver = monthlyGoal > 0 && stats.expense > monthlyGoal;

  const filteredTransactions = useMemo(() => transactions.filter(t => t.date.startsWith(selectedMonth)), [transactions, selectedMonth]);
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return { value: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) };
  }), []);

  // --- 1. SERVER WAKING SCREEN ---
  if (isServerWaking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
        <div className="relative mb-6">
           <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
              <FaServer className="text-indigo-400 text-xl" />
           </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Waking up Server...</h2>
        <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
          Since we use a free server, it goes to sleep when inactive. 
          <br /><br />
          <span className="text-indigo-400 font-bold">This may take up to 60 seconds.</span>
          <br />
          Please don't close the tab.
        </p>
      </div>
    );
  }

  // --- 2. REGULAR LOADING SCREEN ---
  if (isLoading) return <div className="min-h-screen bg-gray-900"></div>;

  // --- 3. MAIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-900">
      
      {/* --- UPPER HALF: Gray & Fixed Content --- */}
      <div className="pt-6 pb-12 px-5 md:pt-10">
        <div className="max-w-3xl mx-auto">
            
            {/* Header (White Text) */}
            <DashboardHeader user={user} onLogout={() => { localStorage.clear(); navigate("/"); }} onNavigateProfile={() => navigate("/profile")} />

            {/* Hero Card */}
            <section className="relative overflow-hidden text-white rounded-md p-6 shadow-2xl shadow-black/20 border border-gray-700/50">
                <div className="relative z-10 flex flex-col justify-between h-full gap-5">
                    
                    {/* Top: Label + Settings */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-400">
                            <FaWallet className="text-[10px]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{monthlyGoal > 0 ? "Free to Spend" : "Net Balance"}</span>
                        </div>
                        <button 
                            onClick={handleSetGoal} 
                            className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-white transition"
                        >
                            Edit Budget
                        </button>
                    </div>

                    {/* Middle: Big Balance */}
                    <div className="flex items-baseline justify-between">
                        <h1 className="text-4xl font-extrabold tracking-tight">
                            Rs. {monthlyGoal > 0 ? remaining.toLocaleString() : stats.balance.toLocaleString()}
                        </h1>
                        {monthlyGoal > 0 && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isOver ? 'bg-rose-500/20 text-rose-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                            {pct}% Used
                            </span>
                        )}
                    </div>

                    {/* Bottom: Inline Stats + Progress */}
                    <div>
                        {monthlyGoal > 0 && (
                            <div className="w-full bg-gray-900 h-1 rounded-full mb-4 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-1000 ${isOver ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }}></div>
                            </div>
                        )}

                        <div className="flex divide-x divide-gray-700/50">
                            <div className="flex-1 flex items-center gap-3 pr-4">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><FaArrowDown size={8} /></div>
                                <div>
                                    <p className="text-[8px] text-gray-400 uppercase font-bold">Income</p>
                                    <p className="text-sm font-bold">Rs.{stats.income.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex-1 flex items-center gap-3 pl-4">
                                <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400"><FaArrowUp size={8} /></div>
                                <div>
                                    <p className="text-[8px] text-gray-400 uppercase font-bold">Expense</p>
                                    <p className="text-sm font-bold">Rs.{stats.expense.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
      </div>

      {/* --- LOWER HALF: White "Sheet" Effect --- */}
      <div className="bg-[#F8FAFC] min-h-screen rounded-t-xl relative mt-4 px-5 pt-8 pb-24 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        <div className="max-w-3xl mx-auto">
            
            {/* Tabs */}
            <div className="bg-gray-200/60 p-1 rounded-xl flex relative mb-6 h-10">
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ${activeTab === 'activity' ? 'left-1' : 'left-[calc(50%+4px)]'}`}></div>
                <button onClick={() => setActiveTab('activity')} className={`flex-1 relative z-10 text-[10px] font-bold uppercase tracking-wider transition ${activeTab === 'activity' ? 'text-gray-900' : 'text-gray-500'}`}>Activity</button>
                <button onClick={() => setActiveTab('analytics')} className={`flex-1 relative z-10 text-[10px] font-bold uppercase tracking-wider transition ${activeTab === 'analytics' ? 'text-gray-900' : 'text-gray-500'}`}>Analytics</button>
            </div>

            {/* List Content */}
            <div className="animate-fade-in-up">
                {activeTab === 'activity' ? (
                    <TransactionList 
                        transactions={filteredTransactions}
                        monthOptions={monthOptions}
                        selectedMonth={selectedMonth}
                        setSelectedMonth={setSelectedMonth}
                        onEdit={(t) => { setTransactionToEdit(t); setIsModalOpen(true); }}
                        onDelete={async (id) => { if (window.confirm("Delete?")) { await api.delete(`/api/payments/${id}`); refreshData(user.id, selectedMonth); } }}
                    />
                ) : (
                    <Analytics transactions={filteredTransactions} monthOptions={monthOptions} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
                )}
            </div>
        </div>
      </div>

      {/* FAB (Floating Action Button) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button onClick={() => { setTransactionToEdit(null); setIsModalOpen(true); }} className="w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg shadow-gray-900/30 flex items-center justify-center hover:scale-105 active:scale-95 transition"><FaPlus size={18} /></button>
      </div>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onTransactionAdded={() => refreshData(user.id, selectedMonth)} transactionToEdit={transactionToEdit} />
    </div>
  );
};

export default Dashboard;