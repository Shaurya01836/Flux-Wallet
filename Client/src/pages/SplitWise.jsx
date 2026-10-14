import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaPlus,
  FaCheckDouble,
  FaTrashAlt,
  FaUserFriends,
  FaReceipt,
  FaSearch,
  FaSpinner,
  FaCheckCircle,
  FaMoneyBillWave,
  FaExclamationCircle,
} from "react-icons/fa";
import api from "../api";
import AddSplitExpenseModal from "../components/AddSplitExpenseModal";

const SplitWise = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  const [balances, setBalances] = useState({
    totalOwedToYou: 0,
    totalYouOwe: 0,
    netBalance: 0,
    friends: [],
  });
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter tab: "ALL", "OWED_TO_ME", "I_OWE", "SETTLED"
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedFriend, setSelectedFriend] = useState(null); // null means all friends
  const [searchFriendText, setSearchFriendText] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultFriend, setModalDefaultFriend] = useState(null);
  const [isSettling, setIsSettling] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user_info");
    if (!storedUser) {
      navigate("/");
      return;
    }
    const userObj = JSON.parse(storedUser);
    setCurrentUser(userObj);
    loadSplitData(userObj.id);
  }, [navigate]);

  const loadSplitData = async (userId) => {
    setIsLoading(true);
    try {
      const [balRes, expRes] = await Promise.all([
        api.get(`/api/split/balances/${userId}`),
        api.get(`/api/split/user/${userId}`),
      ]);
      setBalances(balRes.data || { totalOwedToYou: 0, totalYouOwe: 0, netBalance: 0, friends: [] });
      setExpenses(expRes.data || []);
    } catch (err) {
      console.error("Failed to fetch split data", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Individual settlement removed; only "Settle All" with a friend is supported.

  const handleSettleAllWithFriend = async (friendId, friendName) => {
    const friend = balances.friends?.find((f) => f.friendId === friendId);
    const net = friend?.netAmount || 0;
    let confirmMsg = `Are you sure you want to settle all pending balances with ${friendName}?`;
    if (net > 0) {
      confirmMsg = `${friendName} owes you Rs. ${net.toFixed(2)}. Settle all now?`;
    } else if (net < 0) {
      confirmMsg = `You owe ${friendName} Rs. ${Math.abs(net).toFixed(2)}. Send settlement request for approval?`;
    }
    const ok = await window.confirm(confirmMsg);
    if (!ok) return;
    setIsSettling(true);
    try {
      await api.post(`/api/split/settle-friend?currentUserId=${currentUser.id}&friendId=${friendId}`);
      if (currentUser) await loadSplitData(currentUser.id);
    } catch (err) {
      console.error("Failed to settle with friend", err);
      alert("Failed to settle. Please try again.");
    } finally {
      setIsSettling(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    const ok = await window.confirm("Delete this expense record?");
    if (!ok) return;
    try {
      await api.delete(`/api/split/expense/${expenseId}?currentUserId=${currentUser.id}`);
      if (currentUser) loadSplitData(currentUser.id);
    } catch (err) {
      console.error("Failed to delete expense", err);
      alert("Failed to delete expense.");
    }
  };

  // Filtered Friends
  const filteredFriends = useMemo(() => {
    if (!balances.friends) return [];
    if (!searchFriendText.trim()) return balances.friends;
    const q = searchFriendText.toLowerCase();
    return balances.friends.filter(
      (f) =>
        f.friendName?.toLowerCase().includes(q) ||
        f.friendEmail?.toLowerCase().includes(q)
    );
  }, [balances.friends, searchFriendText]);

  // Filtered Expenses
  const displayedExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // Friend filter
      if (selectedFriend) {
        const matchesFriend =
          (exp.paidById === selectedFriend.friendId && exp.owedById === currentUser?.id) ||
          (exp.owedById === selectedFriend.friendId && exp.paidById === currentUser?.id);
        if (!matchesFriend) return false;
      }

      // Status filter
      if (activeFilter === "SETTLED") {
        return exp.isSettled;
      }
      if (activeFilter === "OWED_TO_ME") {
        return !exp.isSettled && exp.paidById === currentUser?.id;
      }
      if (activeFilter === "I_OWE") {
        return !exp.isSettled && exp.owedById === currentUser?.id;
      }
      // "ALL" shows all, or you can filter active/unsettled by default
      return true;
    });
  }, [expenses, selectedFriend, activeFilter, currentUser]);

  return (
    <div className="min-h-screen bg-[#06080F] font-sans text-gray-100 selection:bg-indigo-500/30 relative overflow-x-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-50px] left-[-10%] w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-indigo-900/30 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[350px] right-[-10%] w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-violet-950/40 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="pt-6 pb-16 px-4 sm:px-6 max-w-6xl mx-auto relative z-10">
        {/* Top Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-300 hover:text-white transition shadow-sm"
              title="Back to Dashboard"
            >
              <FaArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Splitwise
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
                Friend Expenses
              </h1>
            </div>
          </div>

          <button
            onClick={() => {
              setModalDefaultFriend(selectedFriend || null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:scale-105 transition duration-200"
          >
            <FaPlus size={14} />
            <span>Split Expense</span>
          </button>
        </header>

        {/* Balance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Card 1: Total Owed to You */}
          <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-emerald-500/20 backdrop-blur-xl relative overflow-hidden shadow-xl group">
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
            <p className="text-xs uppercase font-extrabold tracking-wider text-emerald-400 mb-2">
              You are owed
            </p>
            <h2 className="text-3xl font-extrabold text-emerald-400">
              ₹{balances.totalOwedToYou?.toFixed(2) || "0.00"}
            </h2>
            <p className="text-xs text-gray-400 mt-2">
              Friends owe you this much in total
            </p>
          </div>

          {/* Card 2: Total You Owe */}
          <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-rose-500/20 backdrop-blur-xl relative overflow-hidden shadow-xl group">
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
            <p className="text-xs uppercase font-extrabold tracking-wider text-rose-400 mb-2">
              You owe
            </p>
            <h2 className="text-3xl font-extrabold text-rose-400">
              ₹{balances.totalYouOwe?.toFixed(2) || "0.00"}
            </h2>
            <p className="text-xs text-gray-400 mt-2">
              You need to pay back to friends
            </p>
          </div>

          {/* Card 3: Net Balance */}
          <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-indigo-500/20 backdrop-blur-xl relative overflow-hidden shadow-xl group">
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
            <p className="text-xs uppercase font-extrabold tracking-wider text-indigo-300 mb-2">
              Total Net Balance
            </p>
            <h2
              className={`text-3xl font-extrabold ${
                balances.netBalance > 0
                  ? "text-emerald-400"
                  : balances.netBalance < 0
                  ? "text-rose-400"
                  : "text-gray-300"
              }`}
            >
              {balances.netBalance > 0 ? "+" : ""}
              ₹{balances.netBalance?.toFixed(2) || "0.00"}
            </h2>
            <p className="text-xs text-gray-400 mt-2">
              {balances.netBalance > 0
                ? "Overall, people owe you"
                : balances.netBalance < 0
                ? "Overall, you are in debt"
                : "All balances settled up"}
            </p>
          </div>
        </div>

        {/* Main Content Layout: Friends List on Left / Expenses Feed on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Friends List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FaUserFriends className="text-indigo-400 text-lg" />
                  <h3 className="font-bold text-base text-white">Friends</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-medium">
                    {filteredFriends.length}
                  </span>
                </div>

                {selectedFriend && (
                  <button
                    onClick={() => setSelectedFriend(null)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    View All
                  </button>
                )}
              </div>

              {/* Search Friends input */}
              <div className="relative mb-4">
                <FaSearch className="absolute left-3.5 top-3.5 text-gray-500 text-xs" />
                <input
                  type="text"
                  value={searchFriendText}
                  onChange={(e) => setSearchFriendText(e.target.value)}
                  placeholder="Filter friends..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Friend list */}
              {isLoading ? (
                <div className="py-12 flex justify-center items-center">
                  <FaSpinner className="animate-spin text-indigo-500 text-2xl" />
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-white/10 rounded-2xl">
                  <p className="text-sm font-semibold text-gray-300">No friends with balances</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click "Split Expense" above to add your first friend expense!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {filteredFriends.map((f) => {
                    const isSelected = selectedFriend?.friendId === f.friendId;
                    return (
                      <div
                        key={f.friendId}
                        onClick={() => setSelectedFriend(isSelected ? null : f)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/10"
                            : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-900 border border-indigo-400/20 flex items-center justify-center font-bold text-sm text-indigo-200 shrink-0">
                              {f.friendPicture ? (
                                <img
                                  src={f.friendPicture}
                                  alt={f.friendName}
                                  className="w-full h-full object-cover rounded-xl"
                                />
                              ) : (
                                f.friendName?.charAt(0).toUpperCase() || "F"
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">
                                {f.friendName}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate">{f.friendEmail}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-2">
                            {f.netAmount > 0 ? (
                              <div>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                  owes you
                                </span>
                                <span className="text-sm font-bold text-emerald-400">
                                  ₹{f.netAmount.toFixed(2)}
                                </span>
                              </div>
                            ) : f.netAmount < 0 ? (
                              <div>
                                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                                  you owe
                                </span>
                                <span className="text-sm font-bold text-rose-400">
                                  ₹{Math.abs(f.netAmount).toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">Settled up</span>
                            )}
                          </div>
                        </div>

                        {/* Settle button if selected */}
                        {isSelected && f.netAmount !== 0 && (
                          <div className="mt-3 pt-3 border-t border-white/10 flex justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSettleAllWithFriend(f.friendId, f.friendName);
                              }}
                              disabled={isSettling}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
                            >
                              <FaCheckDouble size={11} />
                              <span>Settle All Balances</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Expenses History */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-xl shadow-xl">
              {/* Header & Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <FaReceipt className="text-indigo-400" />
                    <span>
                      {selectedFriend
                        ? `Expenses with ${selectedFriend.friendName}`
                        : "Expense Activity"}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {displayedExpenses.length} transaction{displayedExpenses.length === 1 ? "" : "s"}
                  </p>
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 text-xs">
                  <button
                    onClick={() => setActiveFilter("ALL")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${
                      activeFilter === "ALL"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveFilter("OWED_TO_ME")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${
                      activeFilter === "OWED_TO_ME"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Owed to me
                  </button>
                  <button
                    onClick={() => setActiveFilter("I_OWE")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${
                      activeFilter === "I_OWE"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    I owe
                  </button>
                  <button
                    onClick={() => setActiveFilter("SETTLED")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${
                      activeFilter === "SETTLED"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Settled
                  </button>
                </div>
              </div>

              {/* Expenses List */}
              {isLoading ? (
                <div className="py-16 flex justify-center items-center">
                  <FaSpinner className="animate-spin text-indigo-500 text-3xl" />
                </div>
              ) : displayedExpenses.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-white/10 rounded-2xl">
                  <FaMoneyBillWave className="mx-auto text-3xl text-gray-600 mb-2" />
                  <p className="text-sm font-semibold text-gray-300">No expenses found</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Try changing your filter or add a new expense
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {displayedExpenses.map((exp) => {
                    const isPayer = exp.paidById === currentUser?.id;
                    const otherPerson = isPayer
                      ? { name: exp.owedByName, email: exp.owedByEmail }
                      : { name: exp.paidByName, email: exp.paidByEmail };

                    return (
                      <div
                        key={exp.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          exp.isSettled
                            ? "bg-white/[0.01] border-white/5 opacity-60 hover:opacity-100"
                            : "bg-white/[0.03] border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-white truncate">
                                {exp.title}
                              </h4>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 text-gray-400">
                                {exp.category || "General"}
                              </span>
                              {exp.isSettled ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <FaCheckCircle size={9} /> Settled
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Pending
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-gray-400 mt-1">
                              {isPayer ? (
                                <span>
                                  You paid • <strong className="text-gray-200">{otherPerson.name}</strong> owes you
                                </span>
                              ) : (
                                <span>
                                  <strong className="text-gray-200">{otherPerson.name}</strong> paid • You owe
                                </span>
                              )}
                            </p>

                            {exp.notes && (
                              <p className="text-[11px] text-gray-500 mt-1 italic">
                                {exp.notes}
                              </p>
                            )}

                            <p className="text-[10px] text-gray-500 mt-2">
                              {new Date(exp.createdAt.endsWith("Z") ? exp.createdAt : exp.createdAt + "Z").toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p
                              className={`text-base font-extrabold ${
                                isPayer ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {isPayer ? "+" : "-"}₹{exp.amount?.toFixed(2)}
                            </p>

                            <div className="flex items-center justify-end gap-1.5 mt-2">
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                                title="Delete Expense"
                              >
                                <FaTrashAlt size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Split Modal */}
      <AddSplitExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onExpenseAdded={() => {
          if (currentUser) loadSplitData(currentUser.id);
        }}
        currentUser={currentUser}
        defaultFriend={modalDefaultFriend}
      />
    </div>
  );
};

export default SplitWise;
