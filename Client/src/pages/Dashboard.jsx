import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaWallet, FaArrowDown, FaArrowUp, FaServer } from "react-icons/fa";
import api from "../api";
import AddTransactionModal from "../components/AddTransactionModal";
import DashboardHeader from "../components/DashboardHeader";
import TransactionList from "../components/Transaction";
import Analytics from "../components/Analytics";
import DeleteTransactionModal from "../components/DeleteTransactionModal";
import TransactionDetailModal from "../components/TransactionDetailModal";

const Dashboard = () => {
  const navigate = useNavigate();

  // --- State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [activeTab, setActiveTab] = useState("activity");

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [transactionToView, setTransactionToView] = useState(null);

  // Transaction Data
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingTxns, setIsFetchingTxns] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [stats, setStats] = useState({
    balance: 0.0,
    income: 0.0,
    expense: 0.0,
  });
  const [user, setUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [monthlyGoal, setMonthlyGoal] = useState(0);

  // --- Loading States ---
  const [isLoading, setIsLoading] = useState(true);
  const [isServerWaking, setIsServerWaking] = useState(true);

  // --- 1. Init & Server Wake-up ---
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
        console.warn("Server wake check done.");
      } finally {
        setIsServerWaking(false);
        setIsLoading(false);
      }
    };
    initDashboard();
  }, [navigate]);

  // --- 2. Fetch Stats (Balance/Budget) when Month/User changes ---
  useEffect(() => {
    if (!isServerWaking && user && selectedMonth) {
      fetchBudget(user.id, selectedMonth);
      fetchStats(user.id, selectedMonth);
    }
  }, [isServerWaking, user, selectedMonth]);

  // --- 3. Initial Transaction Load (Page 0) ---
  useEffect(() => {
    if (!isServerWaking && user) {
      // Reset list and load page 0
      loadTransactions(0, true);
    }
  }, [isServerWaking, user]);

  const fetchBudget = async (uid, m) => {
    try {
      const res = await api.get(`/api/user/${uid}?month=${m}`);
      setMonthlyGoal(res.data.amount || 0);
    } catch {
      setMonthlyGoal(0);
    }
  };

  const fetchStats = async (uid, m) => {
    try {
      const bal = await api.get(`/api/payments/balance/${uid}?month=${m}`);
      setStats({
        balance: (bal.data.monthlyCredit || 0) - (bal.data.monthlyDebit || 0),
        income: bal.data.monthlyCredit || 0,
        expense: bal.data.monthlyDebit || 0,
      });
    } catch (e) {
      console.error(e);
    }
  };

  // --- INFINITE SCROLL LOADER (FIXED) ---
  const loadTransactions = useCallback(async (pageNum, shouldReset = false) => {
    if (!user) return;
    setIsFetchingTxns(true);

    try {
      const pageSize = 10;
      const res = await api.get(`/api/payments/user/${user.id}?page=${pageNum}&size=${pageSize}`);
      const newData = res.data;

      setTransactions(prev => {
        if (shouldReset) return newData;

        // --- FIX: Filter out duplicates based on ID ---
        const existingIds = new Set(prev.map(t => t.id));
        const uniqueNewData = newData.filter(t => !existingIds.has(t.id));

        return [...prev, ...uniqueNewData];
      });

      // If we got fewer items than requested, we reached the end
      setHasMore(newData.length === pageSize);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to load transactions", error);
    } finally {
      setIsFetchingTxns(false);
    }
  }, [user]);

  const handleLoadMore = () => {
    if (!isFetchingTxns && hasMore) {
      loadTransactions(page + 1);
    }
  };

  // --- Auto-fetch older transactions if needed for the selected month ---
  useEffect(() => {
    if (!isFetchingTxns && hasMore && transactions.length > 0) {
      const oldestLoadedDate = transactions[transactions.length - 1].date;
      const oldestLoadedMonth = oldestLoadedDate.slice(0, 7);
      
      // If we haven't fetched past the selected month yet, we might be missing its transactions
      if (oldestLoadedMonth >= selectedMonth) {
        loadTransactions(page + 1);
      }
    }
  }, [transactions, selectedMonth, isFetchingTxns, hasMore, page, loadTransactions]);

  // --- Actions ---
  const handleSetGoal = async () => {
    const val = await window.prompt("Monthly budget:", monthlyGoal || "");
    if (val && !isNaN(val)) {
      try {
        await api.post("/api/user/budget", {
          amount: parseFloat(val),
          month: selectedMonth,
          user_id: user.id,
        });
        setMonthlyGoal(parseFloat(val));
      } catch {
        alert("Error saving budget");
      }
    }
  };

  const initiateDelete = (id) => {
    setTransactionToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await api.delete(`/api/payments/${transactionToDelete}`);
      // Optimistic update: remove from UI immediately
      setTransactions(prev => prev.filter(t => t.id !== transactionToDelete));
      // Refresh stats
      fetchStats(user.id, selectedMonth);
      setIsDeleteModalOpen(false);
      setTransactionToDelete(null);
    } catch (error) {
      alert("Failed to delete transaction");
      setIsDeleteModalOpen(false);
    }
  };

  const handleTransactionAdded = () => {
    // Reload stats and reset list to show new item at top
    fetchStats(user.id, selectedMonth);
    loadTransactions(0, true);
  };

  // --- Filters & Calcs ---
  const remaining = monthlyGoal - stats.expense;
  const pct = monthlyGoal > 0 ? Math.min(Math.round((stats.expense / monthlyGoal) * 100), 100) : 0;
  const isOver = monthlyGoal > 0 && stats.expense > monthlyGoal;

  const filteredTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(selectedMonth)),
    [transactions, selectedMonth],
  );

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return {
          value: d.toISOString().slice(0, 7),
          label: d.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
        };
      }),
    [],
  );

  if (isServerWaking || isLoading) {
    return (
      <div className="min-h-screen bg-[#06080F] font-sans overflow-hidden relative">
        <div className="absolute top-[-5%] left-[-10%] w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-indigo-900/30 md:bg-indigo-900/20 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>
        <div className="absolute top-[20%] right-[-10%] w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-indigo-950/40 md:bg-gray-900/50 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>

        <div className="pt-6 pb-12 px-5 md:pt-10 relative z-10 max-w-5xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="h-8 w-24 bg-white/10 rounded-md animate-pulse mb-2"></div>
              <div className="h-4 w-40 bg-white/5 rounded-md animate-pulse"></div>
            </div>
            <div className="w-24 h-12 bg-white/10 rounded-[1.5rem] animate-pulse"></div>
          </div>

          {/* Main Card Skeleton */}
          <div className="rounded-[2rem] p-8 border border-white/5 bg-white/[0.02] mb-4">
            <div className="flex justify-between items-center mb-8">
              <div className="h-4 w-24 bg-white/10 rounded-md animate-pulse"></div>
              <div className="h-8 w-20 bg-white/10 rounded-full animate-pulse"></div>
            </div>
            <div className="h-12 w-48 bg-white/10 rounded-md animate-pulse mb-8"></div>
            
            <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
              <div className="h-1.5 w-full bg-white/10 rounded-full animate-pulse mb-6"></div>
              <div className="flex divide-x divide-white/5">
                <div className="flex-1 pr-4">
                   <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse"></div>
                </div>
                <div className="flex-1 pl-4">
                   <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section Skeleton */}
        <div className="bg-[#FAFAFA] min-h-screen rounded-t-[2.5rem] px-5 pt-8 relative z-20 shadow-[0_-15px_40px_rgba(0,0,0,0.3)] mt-[-2rem]">
           <div className="max-w-5xl mx-auto">
             <div className="h-12 w-full bg-gray-200/50 rounded-2xl animate-pulse mb-8"></div>
             
             <div className="space-y-4">
               {[1, 2, 3, 4, 5].map(i => (
                 <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                     <div>
                       <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                       <div className="h-3 w-16 bg-gray-100 rounded animate-pulse"></div>
                     </div>
                   </div>
                   <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080F] font-sans text-gray-900 selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Dark Mode Ambient Background Glows */}
      <div className="absolute top-[-50px] left-[-10%] w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-indigo-900/30 md:bg-indigo-900/20 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[350px] right-[-10%] w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-indigo-950/40 md:bg-gray-900/50 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>

      <div className="pt-6 pb-12 px-5 md:pt-10 relative z-10">
        <div className="max-w-5xl mx-auto">
          <DashboardHeader
            user={user}
            onLogout={async () => {
              if (await window.confirm("Log out of Flux?")) {
                localStorage.clear();
                navigate("/");
              }
            }}
            onNavigateProfile={() => navigate("/profile")}
          />

          <section className="relative mt-2 rounded-[2rem] p-8 shadow-2xl overflow-hidden group border border-white/10 bg-white/[0.02] backdrop-blur-3xl">
            {/* Animated inner gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-rose-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col justify-between h-full gap-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-indigo-300">
                  <FaWallet className="text-[12px]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                    {monthlyGoal > 0 ? "Free to Spend" : "Net Balance"}
                  </span>
                </div>
                <button
                  onClick={handleSetGoal}
                  className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-white transition-all backdrop-blur-md border border-white/5"
                >
                  Edit Budget
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-sm flex items-center">
                    <span className="text-2xl text-indigo-400 font-medium mr-1.5 opacity-80">Rs.</span>
                    {monthlyGoal > 0 ? remaining.toLocaleString() : stats.balance.toLocaleString()}
                  </h1>
                  {monthlyGoal > 0 && (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${isOver ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"} shadow-sm`}>
                      {pct}% Used
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-black/20 p-5 rounded-2xl border border-white/5 shadow-inner">
                {monthlyGoal > 0 && (
                  <div className="w-full bg-black/50 h-1.5 rounded-full mb-6 overflow-hidden shadow-inner relative">
                    <div className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ease-out ${isOver ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"}`} style={{ width: `${pct}%` }}>
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                )}
                <div className="flex divide-x divide-white/5">
                  <div className="flex-1 flex items-center gap-2 md:gap-4 pr-2 md:pr-4 group/income overflow-hidden">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover/income:bg-emerald-500/20 group-hover/income:scale-110 transition-all shrink-0">
                      <FaArrowDown size={12} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-0.5 truncate">Income</p>
                      <p className="text-sm md:text-base font-bold text-gray-100 truncate">Rs.{stats.income.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center gap-2 md:gap-4 pl-3 md:pl-4 group/expense overflow-hidden">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover/expense:bg-rose-500/20 group-hover/expense:scale-110 transition-all shrink-0">
                      <FaArrowUp size={12} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-0.5 truncate">Expense</p>
                      <p className="text-sm md:text-base font-bold text-gray-100 truncate">Rs.{stats.expense.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="bg-[#FAFAFA] min-h-screen rounded-t-[0.2rem] relative mt-[-2rem] px-5 pt-8 pb-24 shadow-[0_-15px_40px_rgba(0,0,0,0.3)] z-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-200/50 p-1.5 rounded-2xl flex relative mb-8 h-12">
            <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${activeTab === "activity" ? "left-1.5" : "left-[calc(50%+4px)]"}`}></div>
            <button onClick={() => setActiveTab("activity")} className={`flex-1 relative z-10 text-[11px] font-bold uppercase tracking-widest transition-colors ${activeTab === "activity" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>Activity</button>
            <button onClick={() => setActiveTab("analytics")} className={`flex-1 relative z-10 text-[11px] font-bold uppercase tracking-widest transition-colors ${activeTab === "analytics" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>Analytics</button>
          </div>

          <div className="animate-fade-in-up">
            {activeTab === "activity" ? (
              <TransactionList
                transactions={filteredTransactions}
                monthOptions={monthOptions}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                onEdit={(t) => { setTransactionToEdit(t); setIsModalOpen(true); }}
                onDelete={initiateDelete}
                onViewDetail={(t) => { setTransactionToView(t); setIsDetailModalOpen(true); }}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                isFetching={isFetchingTxns}
              />
            ) : (
              <Analytics
                transactions={filteredTransactions}
                monthOptions={monthOptions}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
              />
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => { setTransactionToEdit(null); setIsModalOpen(true); }}
          className="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-[0_10px_25px_rgba(79,70,229,0.4)] flex items-center justify-center hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all duration-300"
        >
          <FaPlus size={18} />
        </button>
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionAdded={handleTransactionAdded}
        transactionToEdit={transactionToEdit}
      />
      <DeleteTransactionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />
      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        transaction={transactionToView}
      />
    </div>
  );
};

export default Dashboard;