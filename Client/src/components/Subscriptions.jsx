import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { FaPlus, FaCalendarAlt, FaPen, FaTrashAlt, FaPlay, FaPause, FaSpinner, FaTimes, FaCheck, FaExclamationTriangle, FaSync } from "react-icons/fa";
import { FaMoneyBill1Wave } from "react-icons/fa6";
import api from "../api";

const Subscriptions = ({ onTransactionActivity }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subToEdit, setSubToEdit] = useState(null);
  const [isProcessingDue, setIsProcessingDue] = useState(false);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Entertainment",
    billingCycle: "MONTHLY",
    nextBillingDate: "",
    status: "ACTIVE"
  });

  const [modalStatus, setModalStatus] = useState("IDLE"); // 'IDLE' | 'SUBMITTING' | 'SUCCESS'

  const user = useMemo(() => JSON.parse(localStorage.getItem("user_info")), []);

  const defaultCategories = [
    "Bills & Utilities", "Entertainment", "Health & Fitness", 
    "Rent", "Insurance", "Shopping", "Other"
  ];

  const fetchSubscriptions = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/api/subscriptions/user/${user.id}`);
      setSubscriptions(res.data);
    } catch (error) {
      console.error("Failed to fetch subscriptions", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  // Handle modal submit (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setModalStatus("SUBMITTING");

    try {
      // Form nextBillingDate contains date string, map to ISO string
      let datePayload = null;
      if (form.nextBillingDate) {
        const [year, month, day] = form.nextBillingDate.split('-').map(Number);
        const finalDate = new Date(year, month - 1, day, 12, 0, 0); // Default to noon local time
        datePayload = finalDate.toISOString();
      }

      const payload = {
        userId: user.id,
        title: form.title,
        amount: parseFloat(form.amount),
        category: form.category,
        billingCycle: form.billingCycle,
        nextBillingDate: datePayload,
        status: form.status
      };

      if (subToEdit) {
        await api.put(`/api/subscriptions/${subToEdit.id}`, payload);
      } else {
        await api.post("/api/subscriptions", payload);
      }

      setModalStatus("SUCCESS");
      setTimeout(() => {
        setIsModalOpen(false);
        setSubToEdit(null);
        fetchSubscriptions();
      }, 800);
    } catch (error) {
      console.error("Failed to save subscription", error);
      alert("Error saving subscription");
      setModalStatus("IDLE");
    }
  };

  const handleToggleStatus = async (sub) => {
    const updatedStatus = sub.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const payload = {
        ...sub,
        userId: user.id,
        status: updatedStatus
      };
      await api.put(`/api/subscriptions/${sub.id}`, payload);
      // Optimistic update
      setSubscriptions(prev =>
        prev.map(s => s.id === sub.id ? { ...s, status: updatedStatus } : s)
      );
    } catch (error) {
      console.error("Failed to toggle status", error);
      alert("Error updating subscription status");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await window.confirm("Delete this subscription? It will stop future automated logging.");
    if (!confirmed) return;
    try {
      await api.delete(`/api/subscriptions/${id}`);
      setSubscriptions(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error("Failed to delete subscription", error);
      alert("Error deleting subscription");
    }
  };

  const handleTriggerProcessDue = async () => {
    setIsProcessingDue(true);
    try {
      await api.post("/api/subscriptions/process-due");
      await fetchSubscriptions();
      if (onTransactionActivity) {
        onTransactionActivity(); // refresh balance/recent transactions on dashboard
      }
    } catch (error) {
      console.error("Failed to process due subscriptions", error);
    } finally {
      setIsProcessingDue(false);
    }
  };

  // Open modal for add or edit
  const openModal = (sub = null) => {
    setModalStatus("IDLE");
    if (sub) {
      setSubToEdit(sub);
      setForm({
        title: sub.title,
        amount: sub.amount,
        category: sub.category,
        billingCycle: sub.billingCycle,
        nextBillingDate: sub.nextBillingDate ? sub.nextBillingDate.split('T')[0] : "",
        status: sub.status
      });
    } else {
      setSubToEdit(null);
      const today = new Date().toISOString().split('T')[0];
      setForm({
        title: "",
        amount: "",
        category: "Entertainment",
        billingCycle: "MONTHLY",
        nextBillingDate: today,
        status: "ACTIVE"
      });
    }
    setIsModalOpen(true);
  };

  // Normative monthly cost calculation
  const monthlyOutflow = useMemo(() => {
    return subscriptions
      .filter(sub => sub.status === "ACTIVE")
      .reduce((acc, sub) => {
        let monthlyEquiv = sub.amount;
        if (sub.billingCycle === "WEEKLY") {
          monthlyEquiv = sub.amount * 4.33; // 52 weeks / 12 months
        } else if (sub.billingCycle === "YEARLY") {
          monthlyEquiv = sub.amount / 12;
        }
        return acc + monthlyEquiv;
      }, 0);
  }, [subscriptions]);

  const activeCount = useMemo(() => {
    return subscriptions.filter(sub => sub.status === "ACTIVE").length;
  }, [subscriptions]);

  // Identify subscriptions due in < 7 days
  const upcomingBills = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return subscriptions.filter(sub => {
      if (sub.status !== "ACTIVE" || !sub.nextBillingDate) return false;
      const dueDate = new Date(sub.nextBillingDate);
      return dueDate >= today && dueDate <= nextWeek;
    });
  }, [subscriptions]);

  const getDaysLeft = (dueDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Due Today";
    if (diffDays === 1) return "Due Tomorrow";
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    return `Due in ${diffDays} days`;
  };

  return (
    <section className="pb-10 animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FaMoneyBill1Wave className="text-indigo-600" /> Subscriptions
        </h3>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <button
            onClick={handleTriggerProcessDue}
            disabled={isProcessingDue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-800 disabled:opacity-50 transition-all cursor-pointer"
            title="Refresh and process any active bills that are due now"
          >
            <FaSync className={`text-[10px] ${isProcessingDue ? 'animate-spin text-indigo-500' : ''}`} />
            {isProcessingDue ? 'Processing...' : 'Run Due Check'}
          </button>
          
          <button
            onClick={() => openModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all hover:scale-[1.02]"
          >
            <FaPlus className="text-[10px]" /> Add Subscription
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Monthly Cost</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Rs. {Math.round(monthlyOutflow).toLocaleString()}
          </h2>
          <span className="text-[10px] text-gray-400 font-medium mt-1">Normalized across billing cycles</span>
        </div>

        <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Active Tracker</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {activeCount}
          </h2>
          <span className="text-[10px] text-gray-400 font-medium mt-1">Active repeating debits</span>
        </div>
      </div>

      {/* Upcoming Alerts Banner */}
      {upcomingBills.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/50 rounded-2xl p-5 text-amber-900 flex items-start gap-4 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <FaExclamationTriangle size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold tracking-tight">Upcoming renewals due in next 7 days</h4>
            <div className="mt-2 space-y-1.5">
              {upcomingBills.map(bill => (
                <div key={bill.id} className="flex justify-between items-center text-xs text-amber-800/95 font-semibold">
                  <span className="truncate">{bill.title}</span>
                  <span className="shrink-0 bg-amber-100/80 px-2 py-0.5 rounded-lg ml-2">
                    Rs.{bill.amount.toLocaleString()} ({getDaysLeft(bill.nextBillingDate)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main List / Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FaSpinner className="animate-spin text-indigo-600 mb-4" size={24} />
          <p className="text-xs font-bold uppercase tracking-widest">Fetching subscriptions...</p>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-4 shadow-inner">
            <FaCalendarAlt size={24} />
          </div>
          <p className="text-gray-900 font-bold text-lg mb-1">No subscriptions tracked yet</p>
          <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
            Add your recurring payments like Netflix, Spotify, gym, or rent to automate your transactions and monitor upcoming bills!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => {
            const isPaused = sub.status !== "ACTIVE";
            const daysLeft = sub.nextBillingDate ? getDaysLeft(sub.nextBillingDate) : null;
            const isOverdue = daysLeft && daysLeft.includes("Overdue");

            return (
              <div
                key={sub.id}
                className={`group bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-md hover:shadow-gray-100/50 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isPaused ? "opacity-65" : ""}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Play/Pause indicator circle */}
                  <div
                    onClick={() => handleToggleStatus(sub)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0 ${isPaused ? "bg-amber-50 hover:bg-amber-100 text-amber-600" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"}`}
                    title={isPaused ? "Resume Subscription" : "Pause Subscription"}
                  >
                    {isPaused ? <FaPlay size={10} className="ml-0.5" /> : <FaPause size={10} />}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm leading-tight group-hover:text-indigo-900 transition-colors truncate">
                      {sub.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest shrink-0">
                        {sub.category}
                      </span>
                      <span className="text-gray-300 text-[10px]">•</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isPaused ? "text-amber-500" : isOverdue ? "text-rose-500 animate-pulse" : "text-indigo-500"}`}>
                        {isPaused ? "Paused" : daysLeft}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t border-gray-50 pt-3 sm:border-t-0 sm:pt-0 pl-0 sm:pl-3">
                  <div className="text-left sm:text-right">
                    <span className="font-extrabold text-sm text-gray-900 tracking-tight tabular-nums block">
                      Rs.{sub.amount.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mt-0.5">
                      / {sub.billingCycle?.toLowerCase() || 'month'}
                    </span>
                  </div>

                  <div className="flex gap-1 md:w-0 md:overflow-hidden md:opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 ease-out">
                    <button
                      onClick={() => openModal(sub)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                      title="Edit Settings"
                    >
                      <FaPen size={11} />
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"
                      title="Delete"
                    >
                      <FaTrashAlt size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inline Modal (Add/Edit Subscription) */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-gray-900/40 backdrop-blur-md transition-all duration-300 animate-fade-in">
          {/* Backdrop */}
          <div className="absolute inset-0 cursor-default" onClick={() => setIsModalOpen(false)} />

          <div className="bg-white w-full max-w-md md:rounded-[2rem] rounded-t-[2rem] p-6 shadow-2xl relative animate-slide-up">
            {/* Header */}
            <div className="flex justify-between items-center mb-5 border-b border-gray-50 pb-3">
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
                {subToEdit ? "Edit Subscription" : "New Subscription Tracker"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={modalStatus !== "IDLE"}
                className="p-2 -mr-2 text-gray-300 hover:text-gray-900 transition-colors rounded-full"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Hero Amount Input */}
              <div className="text-center my-2">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-2xl font-bold text-indigo-500 opacity-50">Rs.</span>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="0"
                    autoFocus={!subToEdit}
                    className="w-40 bg-transparent text-5xl font-extrabold text-gray-900 text-center outline-none placeholder-gray-200 tabular-nums caret-indigo-600"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">recurring debit amount</span>
              </div>

              {/* Input Fields */}
              <div className="space-y-3">
                {/* Subscription Title */}
                <div>
                  <label className="text-[9px] text-gray-400 font-bold uppercase tracking-widest ml-1 mb-1 block">Service Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Netflix, Spotify, House Rent"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100 transition-all outline-none"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                {/* Category & Billing Cycle Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-widest ml-1 mb-1 block">Category</label>
                    <select
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-xs text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-gray-100"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {defaultCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-widest ml-1 mb-1 block">Billing Cycle</label>
                    <select
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-xs text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-gray-100"
                      value={form.billingCycle}
                      onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
                    >
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                </div>

                {/* Next Renewal Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-widest ml-1 mb-1 block">Next Renewal Date</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-xs text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-gray-100 text-center"
                      value={form.nextBillingDate}
                      onChange={(e) => setForm({ ...form, nextBillingDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-widest ml-1 mb-1 block">Status</label>
                    <select
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-xs text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-gray-100"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="ACTIVE">Active (Logging)</option>
                      <option value="PAUSED">Paused (Muted)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={modalStatus !== "IDLE"}
                className={`
                  w-full py-3.5 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2
                  ${modalStatus === "SUCCESS" ? "bg-green-500 text-white shadow-none" : ""}
                  ${modalStatus === "SUBMITTING" ? "bg-gray-100 text-gray-400 cursor-wait" : ""}
                  ${modalStatus === "IDLE" ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.01] shadow-lg shadow-indigo-100" : ""}
                `}
              >
                {modalStatus === "SUBMITTING" && <FaSpinner className="animate-spin animate-pulse" />}
                {modalStatus === "SUCCESS" && <FaCheck className="animate-bounce-short" />}
                <span>
                  {modalStatus === "SUBMITTING" ? "Saving..." : 
                   modalStatus === "SUCCESS" ? "Saved!" : 
                   subToEdit ? "Update Tracker" : "Create Tracker"}
                </span>
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

export default Subscriptions;
