import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaWallet, FaArrowDown, FaArrowUp, FaServer, FaUserFriends, FaCalendarAlt } from "react-icons/fa";
import api from "../api";
import AddTransactionModal from "../components/AddTransactionModal";
import DashboardHeader from "../components/DashboardHeader";
import TransactionList from "../components/Transaction";
import Analytics from "../components/Analytics";
import DeleteTransactionModal from "../components/DeleteTransactionModal";
import TransactionDetailModal from "../components/TransactionDetailModal";
import Subscriptions from "../components/Subscriptions";
import SplitExpensesTab from "../components/SplitExpensesTab";

const Dashboard = () => {
  const navigate = useNavigate();

  // Child Refs for tab-specific actions
  const splitRef = useRef(null);
  const subsRef = useRef(null);

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
        console.error("Database health check failed", error);
      } finally {
        setIsServerWaking(false);
        setIsLoading(false);
      }
    };
    initDashboard();
  }, [navigate]);

  // Split Stats (for dynamic header when on Split tab)
  const [splitStats, setSplitStats] = useState({
    totalOwedToYou: 0,
    totalYouOwe: 0,
    netBalance: 0,
  });

  // Subscription Stats (for dynamic header when on Subscriptions tab)
  const [subStats, setSubStats] = useState({
    monthlyOutflow: 0,
    activeCount: 0,
    upcomingDueTotal: 0,
  });

  // --- 2. Fetch Stats (Balance/Budget/Split/Subs) when Month/User changes ---
  useEffect(() => {
    if (!isServerWaking && user && selectedMonth) {
      fetchBudget(user.id, selectedMonth);
      fetchStats(user.id, selectedMonth);
      fetchSplitStats(user.id);
      fetchSubStats(user.id);
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

  const fetchSplitStats = async (uid) => {
    try {
      const res = await api.get(`/api/split/balances/${uid}`);
      if (res.data) {
        setSplitStats({
          totalOwedToYou: res.data.totalOwedToYou || 0,
          totalYouOwe: res.data.totalYouOwe || 0,
          netBalance: res.data.netBalance || 0,
        });
      }
    } catch (e) {
      console.error("Failed to fetch split stats", e);
    }
  };

  const fetchSubStats = async (uid) => {
    try {
      const res = await api.get(`/api/subscriptions/user/${uid}`);
      const subs = res.data || [];
      const activeSubs = subs.filter((s) => s.status === "ACTIVE");
      const outflow = activeSubs.reduce((acc, s) => {
        let monthly = s.amount;
        if (s.billingCycle === "WEEKLY") monthly = s.amount * 4.33;
        else if (s.billingCycle === "YEARLY") monthly = s.amount / 12;
        return acc + monthly;
      }, 0);

      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const dueTotal = activeSubs.filter((s) => {
        if (!s.nextBillingDate) return false;
        const d = new Date(s.nextBillingDate.endsWith("Z") ? s.nextBillingDate : s.nextBillingDate + "Z");
        return d >= today && d <= nextWeek;
      }).reduce((acc, s) => acc + s.amount, 0);

      setSubStats({
        monthlyOutflow: Math.round(outflow),
        activeCount: activeSubs.length,
        upcomingDueTotal: Math.round(dueTotal),
      });
    } catch (e) {
      console.error("Failed to fetch sub stats", e);
    }
  };

  // Guard against concurrent fetching
  const isFetchingRef = React.useRef(false);

  // --- INFINITE SCROLL LOADER ---
  const loadTransactions = useCallback(async (pageNum, shouldReset = false) => {
    if (!user || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsFetchingTxns(true);

    try {
      const pageSize = 15;
      const res = await api.get(`/api/payments/user/${user.id}?page=${pageNum}&size=${pageSize}`);
      const newData = res.data || [];

      setTransactions(prev => {
        if (shouldReset) return newData;
        const existingIds = new Set(prev.map(t => t.id));
        const uniqueNewData = newData.filter(t => !existingIds.has(t.id));
        return [...prev, ...uniqueNewData];
      });

      setHasMore(newData.length === pageSize);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to load transactions", error);
    } finally {
      isFetchingRef.current = false;
      setIsFetchingTxns(false);
    }
  }, [user]);

  const handleLoadMore = useCallback(() => {
    if (!isFetchingRef.current && hasMore) {
      loadTransactions(page + 1);
    }
  }, [hasMore, page, loadTransactions]);

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
            onSelectTab={setActiveTab}
          />

          <section className="relative mt-2 rounded-[2rem] p-8 shadow-2xl overflow-hidden group border border-white/10 bg-white/[0.02] backdrop-blur-3xl transition-all duration-500">
            {/* Animated inner gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-700 pointer-events-none opacity-50 group-hover:opacity-100 ${
              activeTab === "split"
                ? "from-emerald-500/10 via-transparent to-rose-500/10"
                : activeTab === "subscriptions"
                ? "from-indigo-500/15 via-transparent to-purple-500/10"
                : "from-indigo-500/10 via-transparent to-rose-500/5"
            }`}></div>

            <div className="relative z-10 flex flex-col justify-between h-full gap-8">
              {/* Header row inside card */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-indigo-300">
                  {activeTab === "split" ? (
                    <FaUserFriends className="text-[12px]" />
                  ) : activeTab === "subscriptions" ? (
                    <FaCalendarAlt className="text-[12px]" />
                  ) : (
                    <FaWallet className="text-[12px]" />
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                    {activeTab === "split"
                      ? "Net Split Balance"
                      : activeTab === "subscriptions"
                      ? "Monthly Subscriptions"
                      : monthlyGoal > 0
                      ? "Free to Spend"
                      : "Net Balance"}
                  </span>
                </div>

                {activeTab === "activity" || activeTab === "analytics" ? (
                  <button
                    onClick={handleSetGoal}
                    className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-white transition-all backdrop-blur-md border border-white/5 cursor-pointer"
                  >
                    Edit Budget
                  </button>
                ) : activeTab === "split" ? (
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                    splitStats.netBalance > 0
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : splitStats.netBalance < 0
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : "bg-white/5 text-gray-400 border-white/10"
                  }`}>
                    {splitStats.netBalance > 0 ? "You are Owed" : splitStats.netBalance < 0 ? "You are in Debt" : "All Settled"}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {subStats.activeCount} Active
                  </span>
                )}
              </div>

              {/* Hero Amount */}
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-sm flex items-center tabular-nums">
                    <span className="text-2xl text-indigo-400 font-medium mr-1.5 opacity-80">Rs.</span>
                    {activeTab === "split"
                      ? (splitStats.netBalance > 0 ? `+${splitStats.netBalance.toLocaleString()}` : Math.abs(splitStats.netBalance).toLocaleString())
                      : activeTab === "subscriptions"
                      ? subStats.monthlyOutflow.toLocaleString()
                      : monthlyGoal > 0
                      ? remaining.toLocaleString()
                      : stats.balance.toLocaleString()}
                  </h1>

                  {/* Badge on Right */}
                  {activeTab === "activity" && monthlyGoal > 0 ? (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${isOver ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"} shadow-sm`}>
                      {pct}% Used
                    </span>
                  ) : activeTab === "split" ? (
                    <span className="text-xs font-bold text-gray-400">
                      {splitStats.netBalance >= 0 ? "Overall Positive" : "Overall Negative"}
                    </span>
                  ) : activeTab === "subscriptions" ? (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 shadow-sm">
                      Per Month
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Lower Breakdown Card */}
              <div className="bg-black/20 p-5 rounded-2xl border border-white/5 shadow-inner">
                {activeTab === "activity" && monthlyGoal > 0 && (
                  <div className="w-full bg-black/50 h-1.5 rounded-full mb-6 overflow-hidden shadow-inner relative">
                    <div className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ease-out ${isOver ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"}`} style={{ width: `${pct}%` }}>
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                )}

                <div className="flex divide-x divide-white/5">
                  {/* Left Pill */}
                  <div className="flex-1 flex items-center gap-2 md:gap-4 pr-2 md:pr-4 group/income overflow-hidden">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover/income:bg-emerald-500/20 group-hover/income:scale-110 transition-all shrink-0">
                      <FaArrowDown size={12} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-0.5 truncate">
                        {activeTab === "split" ? "Owed to you" : activeTab === "subscriptions" ? "Active Subs" : "Income"}
                      </p>
                      <p className="text-sm md:text-base font-bold text-gray-100 truncate tabular-nums">
                        {activeTab === "split"
                          ? `Rs.${splitStats.totalOwedToYou.toLocaleString()}`
                          : activeTab === "subscriptions"
                          ? `${subStats.activeCount} Subscriptions`
                          : `Rs.${stats.income.toLocaleString()}`}
                      </p>
                    </div>
                  </div>

                  {/* Right Pill */}
                  <div className="flex-1 flex items-center gap-2 md:gap-4 pl-3 md:pl-4 group/expense overflow-hidden">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover/expense:bg-rose-500/20 group-hover/expense:scale-110 transition-all shrink-0">
                      <FaArrowUp size={12} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-0.5 truncate">
                        {activeTab === "split" ? "You Owe" : activeTab === "subscriptions" ? "Due This Week" : "Expense"}
                      </p>
                      <p className="text-sm md:text-base font-bold text-gray-100 truncate tabular-nums">
                        {activeTab === "split"
                          ? `Rs.${splitStats.totalYouOwe.toLocaleString()}`
                          : activeTab === "subscriptions"
                          ? `Rs.${subStats.upcomingDueTotal.toLocaleString()}`
                          : `Rs.${stats.expense.toLocaleString()}`}
                      </p>
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
          <div className="bg-gray-200/50 p-1 rounded-2xl flex relative mb-6 sm:mb-8 h-11 sm:h-12 overflow-hidden">
            <div
              className={`absolute top-1 bottom-1 w-[calc(25%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${
                activeTab === "activity"
                  ? "left-1"
                  : activeTab === "split"
                  ? "left-[calc(25%+1px)]"
                  : activeTab === "subscriptions"
                  ? "left-[calc(50%+1px)]"
                  : "left-[calc(75%+1px)]"
              }`}
            ></div>
            <button
              onClick={() => setActiveTab("activity")}
              className={`flex-1 relative z-10 px-1 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest transition-colors truncate cursor-pointer ${
                activeTab === "activity" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab("split")}
              className={`flex-1 relative z-10 px-1 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest transition-colors truncate cursor-pointer ${
                activeTab === "split" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`flex-1 relative z-10 px-1 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest transition-colors truncate cursor-pointer ${
                activeTab === "subscriptions" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="sm:hidden">Subs</span>
              <span className="hidden sm:inline">Subscriptions</span>
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex-1 relative z-10 px-1 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest transition-colors truncate cursor-pointer ${
                activeTab === "analytics" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Analytics
            </button>
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
            ) : activeTab === "split" ? (
              <SplitExpensesTab
                ref={splitRef}
                user={user}
                onSplitActivity={(data) => {
                  if (data) {
                    setSplitStats({
                      totalOwedToYou: data.totalOwedToYou || 0,
                      totalYouOwe: data.totalYouOwe || 0,
                      netBalance: data.netBalance || 0,
                    });
                  } else if (user) {
                    fetchSplitStats(user.id);
                  }
                }}
              />
            ) : activeTab === "subscriptions" ? (
              <Subscriptions
                ref={subsRef}
                onTransactionActivity={() => {
                  fetchStats(user.id, selectedMonth);
                  fetchSubStats(user.id);
                  loadTransactions(0, true);
                }}
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
          onClick={() => {
            if (activeTab === "split") {
              splitRef.current?.openAddExpenseModal();
            } else if (activeTab === "subscriptions") {
              subsRef.current?.openAddSubscriptionModal();
            } else {
              setTransactionToEdit(null);
              setIsModalOpen(true);
            }
          }}
          className="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-[0_10px_25px_rgba(79,70,229,0.4)] flex items-center justify-center hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all duration-300 cursor-pointer"
          title={
            activeTab === "split"
              ? "Add Split Expense"
              : activeTab === "subscriptions"
              ? "Add Subscription"
              : "Add Transaction"
          }
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