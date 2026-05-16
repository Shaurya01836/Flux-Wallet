import { useState, useEffect, useMemo } from "react";
import api from "../api"; 
import { getStorage } from "../utils/storage"; 

export const useDashboardLogic = (navigateOrNavigation) => {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ balance: 0.0, income: 0.0, expense: 0.0 });
  const [monthlyGoal, setMonthlyGoal] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isLoading, setIsLoading] = useState(true);
  const [isServerWaking, setIsServerWaking] = useState(true);

  // 1. Initialization
  useEffect(() => {
    const init = async () => {
      const u = await getStorage("user_info");
      if (!u) {
        return; 
      }
      setUser(u);
      
      // Server Wake
      try { await api.get("/health-check"); } 
      catch (e) { console.log("Wake ping done"); }
      finally { 
         setIsServerWaking(false); 
         setIsLoading(false); 
      }
    };
    init();
  }, []);

  // 2. Data Fetching
  useEffect(() => {
    if (!isServerWaking && user) {
      fetchData();
    }
  }, [isServerWaking, user, selectedMonth]);

  const fetchData = async () => {
    try {
      const bal = await api.get(`/api/payments/balance/${user.id}?month=${selectedMonth}`);
      setStats({
        balance: (bal.data.monthlyCredit || 0) - (bal.data.monthlyDebit || 0),
        income: bal.data.monthlyCredit || 0,
        expense: bal.data.monthlyDebit || 0,
      });
      const txs = await api.get(`/api/payments/user/${user.id}`);
      setTransactions(txs.data);
      const goal = await api.get(`/api/user/${user.id}?month=${selectedMonth}`);
      setMonthlyGoal(goal.data.amount || 0);
    } catch (e) { console.error(e); }
  };

  // 3. Actions
  const saveGoal = async (amount) => {
      await api.post('/api/user/budget', { amount, month: selectedMonth, user_id: user.id });
      setMonthlyGoal(amount);
  };

  const deleteTransaction = async (id) => {
      await api.delete(`/api/payments/${id}`);
      await fetchData();
  };

  // 4. Calculations
  const remaining = monthlyGoal - stats.expense;
  const percentage = monthlyGoal > 0 ? Math.min(Math.round((stats.expense / monthlyGoal) * 100), 100) : 0;
  const isOverBudget = monthlyGoal > 0 && stats.expense > monthlyGoal;
  
  const filteredTransactions = useMemo(() => 
    transactions.filter(t => t.date.startsWith(selectedMonth)), 
  [transactions, selectedMonth]);

  return {
    user,
    stats,
    transactions: filteredTransactions,
    monthlyGoal,
    selectedMonth,
    setSelectedMonth,
    isLoading,
    isServerWaking,
    remaining,
    percentage,
    isOverBudget,
    saveGoal,
    deleteTransaction,
    refreshData: fetchData
  };
};