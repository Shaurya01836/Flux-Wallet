import React, { useState, useEffect, useMemo } from "react";
import {
  FaUserFriends,
  FaPlus,
  FaReceipt,
  FaSearch,
  FaSpinner,
  FaCheckCircle,
  FaCheckDouble,
  FaTrashAlt,
  FaMoneyBillWave,
  FaArrowUp,
  FaArrowDown,
  FaSync,
  FaUserPlus,
  FaCheck,
  FaClock,
} from "react-icons/fa";
import api from "../api";
import AddSplitExpenseModal from "./AddSplitExpenseModal";
import AddFriendModal from "./AddFriendModal";

const SplitExpensesTab = ({ user }) => {
  const [balances, setBalances] = useState({
    totalOwedToYou: 0,
    totalYouOwe: 0,
    netBalance: 0,
    friends: [],
  });
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs & filters
  const [activeFilter, setActiveFilter] = useState("ALL"); // ALL | OWED_TO_ME | I_OWE | SETTLED
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [searchFriendText, setSearchFriendText] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [modalDefaultFriend, setModalDefaultFriend] = useState(null);
  const [isSettling, setIsSettling] = useState(false);

  const loadSplitData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [balRes, expRes] = await Promise.all([
        api.get(`/api/split/balances/${user.id}`),
        api.get(`/api/split/user/${user.id}`),
      ]);
      setBalances(balRes.data || { totalOwedToYou: 0, totalYouOwe: 0, netBalance: 0, friends: [] });
      setExpenses(expRes.data || []);
    } catch (err) {
      console.error("Failed to fetch split data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSplitData();
  }, [user]);

  const handleFriendAdded = (newFriend) => {
    loadSplitData();
    // Pre-select the newly added friend
    if (newFriend) {
      setSelectedFriend({
        friendId: newFriend.id,
        friendName: newFriend.name,
        friendEmail: newFriend.email,
        friendPicture: newFriend.pictureUrl,
        isOnboarded: newFriend.lastLoginAt != null,
        netAmount: 0,
        youPaidForThem: 0,
        theyPaidForYou: 0,
      });
    }
  };

  const handleSettleSingle = async (expenseId) => {
    const ok = await window.confirm("Mark this expense as settled?");
    if (!ok) return;
    try {
      await api.put(`/api/split/settle/${expenseId}`);
      loadSplitData();
    } catch (err) {
      console.error("Failed to settle expense", err);
      alert("Failed to settle expense.");
    }
  };

  const handleSettleAllWithFriend = async (friendId, friendName) => {
    const ok = await window.confirm(`Settle all pending balances with ${friendName}?`);
    if (!ok) return;
    setIsSettling(true);
    try {
      await api.post(`/api/split/settle-friend?currentUserId=${user.id}&friendId=${friendId}`);
      await loadSplitData();
    } catch (err) {
      console.error("Failed to settle with friend", err);
      alert("Failed to settle balances.");
    } finally {
      setIsSettling(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    const ok = await window.confirm("Delete this expense record?");
    if (!ok) return;
    try {
      await api.delete(`/api/split/expense/${expenseId}?currentUserId=${user.id}`);
      loadSplitData();
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
      if (selectedFriend) {
        const matchesFriend =
          (exp.paidById === selectedFriend.friendId && exp.owedById === user?.id) ||
          (exp.owedById === selectedFriend.friendId && exp.paidById === user?.id);
        if (!matchesFriend) return false;
      }

      if (activeFilter === "SETTLED") return exp.isSettled;
      if (activeFilter === "OWED_TO_ME") return !exp.isSettled && exp.paidById === user?.id;
      if (activeFilter === "I_OWE") return !exp.isSettled && exp.owedById === user?.id;
      return true;
    });
  }, [expenses, selectedFriend, activeFilter, user]);

  return (
    <section className="pb-10 animate-fade-in space-y-8">
      {/* Tab Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FaUserFriends className="text-indigo-600" /> Split with Friends
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Share and settle expenses with friends just like Splitwise
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddFriendModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
            title="Add a friend by phone or email"
          >
            <FaUserPlus className="text-[10px]" /> Add Friend
          </button>

          <button
            onClick={loadSplitData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-800 transition-all cursor-pointer shadow-sm"
            title="Refresh balances"
          >
            <FaSync className={`text-[10px] ${isLoading ? "animate-spin text-indigo-500" : ""}`} />
            Refresh
          </button>

          <button
            onClick={() => {
              setModalDefaultFriend(selectedFriend || null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all hover:scale-[1.02]"
          >
            <FaPlus className="text-[10px]" /> Split Expense
          </button>
        </div>
      </div>

      {/* 3 Metric Cards matching Dashboard card styling */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: You are owed */}
        <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              You are owed
            </p>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <FaArrowDown size={11} />
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight mt-2">
            Rs. {balances.totalOwedToYou?.toFixed(2) || "0.00"}
          </h2>
          <span className="text-[10px] text-gray-400 font-medium mt-1">
            Friends owe you this amount
          </span>
        </div>

        {/* Card 2: You owe */}
        <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              You owe
            </p>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <FaArrowUp size={11} />
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight mt-2">
            Rs. {balances.totalYouOwe?.toFixed(2) || "0.00"}
          </h2>
          <span className="text-[10px] text-gray-400 font-medium mt-1">
            You need to pay back to friends
          </span>
        </div>

        {/* Card 3: Net Balance */}
        <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Net Balance
            </p>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <FaMoneyBillWave size={11} />
            </span>
          </div>
          <h2
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 ${
              balances.netBalance > 0
                ? "text-emerald-600"
                : balances.netBalance < 0
                ? "text-rose-600"
                : "text-gray-900"
            }`}
          >
            {balances.netBalance > 0 ? "+" : ""}
            Rs. {balances.netBalance?.toFixed(2) || "0.00"}
          </h2>
          <span className="text-[10px] text-gray-400 font-medium mt-1">
            {balances.netBalance > 0
              ? "Overall, friends owe you"
              : balances.netBalance < 0
              ? "Overall, you are in debt"
              : "All settled up"}
          </span>
        </div>
      </div>

      {/* Grid: Friends Breakdown on Left / Expense Feed on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Friends with Balances */}
        <div className="lg:col-span-5 bg-white rounded-[1.5rem] border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <FaUserFriends className="text-indigo-600" />
              <span>Friends</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                {filteredFriends.length}
              </span>
            </h4>
            {selectedFriend && (
              <button
                onClick={() => setSelectedFriend(null)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
              >
                Show All
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="relative">
            <FaSearch className="absolute left-3.5 top-3 text-gray-400 text-xs" />
            <input
              type="text"
              value={searchFriendText}
              onChange={(e) => setSearchFriendText(e.target.value)}
              placeholder="Search friends..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Friends list */}
          {isLoading ? (
            <div className="py-10 flex justify-center">
              <FaSpinner className="animate-spin text-indigo-600 text-xl" />
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-8 px-3 border border-dashed border-gray-200 rounded-2xl">
              <p className="text-xs font-bold text-gray-700">No active friend balances</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Click "Split Expense" above to add your first friend expense!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredFriends.map((f) => {
                const isSelected = selectedFriend?.friendId === f.friendId;
                return (
                  <div
                    key={f.friendId}
                    onClick={() => setSelectedFriend(isSelected ? null : f)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-indigo-50/70 border-indigo-300 shadow-sm"
                        : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold text-gray-900 truncate">{f.friendName}</p>
                            {f.isOnboarded ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200" title="Joined on Flux">
                                <FaCheck size={7} /> Onboarded
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200" title="Pending joining - split history is ready">
                                <FaClock size={7} /> Pending Invite
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 truncate">
                            {f.friendPhoneNumber || f.friendEmail}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {f.netAmount > 0 ? (
                          <div>
                            <span className="text-[9px] font-extrabold uppercase text-emerald-600 block">
                              owes you
                            </span>
                            <span className="text-xs font-extrabold text-emerald-600">
                              Rs. {f.netAmount.toFixed(2)}
                            </span>
                          </div>
                        ) : f.netAmount < 0 ? (
                          <div>
                            <span className="text-[9px] font-extrabold uppercase text-rose-600 block">
                              you owe
                            </span>
                            <span className="text-xs font-extrabold text-rose-600">
                              Rs. {Math.abs(f.netAmount).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-semibold">Settled</span>
                        )}
                      </div>
                    </div>

                    {isSelected && f.netAmount !== 0 && (
                      <div className="mt-3 pt-3 border-t border-indigo-100 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSettleAllWithFriend(f.friendId, f.friendName);
                          }}
                          disabled={isSettling}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition"
                        >
                          <FaCheckDouble size={10} />
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

        {/* Right Column: Expense Activities */}
        <div className="lg:col-span-7 bg-white rounded-[1.5rem] border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <FaReceipt className="text-indigo-600" />
                <span>
                  {selectedFriend ? `Expenses with ${selectedFriend.friendName}` : "Expense Activity"}
                </span>
              </h4>
              <p className="text-[11px] text-gray-400">
                {displayedExpenses.length} transaction{displayedExpenses.length === 1 ? "" : "s"}
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-[11px]">
              <button
                onClick={() => setActiveFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  activeFilter === "ALL"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter("OWED_TO_ME")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  activeFilter === "OWED_TO_ME"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Owed to me
              </button>
              <button
                onClick={() => setActiveFilter("I_OWE")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  activeFilter === "I_OWE"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                I owe
              </button>
              <button
                onClick={() => setActiveFilter("SETTLED")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  activeFilter === "SETTLED"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Settled
              </button>
            </div>
          </div>

          {/* Expense Cards */}
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <FaSpinner className="animate-spin text-indigo-600 text-2xl" />
            </div>
          ) : displayedExpenses.length === 0 ? (
            <div className="text-center py-12 px-3 border border-dashed border-gray-200 rounded-2xl">
              <FaMoneyBillWave className="mx-auto text-3xl text-gray-300 mb-2" />
              <p className="text-xs font-bold text-gray-700">No expenses recorded</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Add an expense to start sharing balances with friends.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {displayedExpenses.map((exp) => {
                const isPayer = exp.paidById === user?.id;
                const otherPerson = isPayer
                  ? { name: exp.owedByName, email: exp.owedByEmail }
                  : { name: exp.paidByName, email: exp.paidByEmail };

                return (
                  <div
                    key={exp.id}
                    className={`p-3.5 rounded-2xl border transition ${
                      exp.isSettled
                        ? "bg-gray-50/50 border-gray-100 opacity-70 hover:opacity-100"
                        : "bg-white border-gray-100 hover:border-gray-200 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-xs text-gray-900 truncate">
                            {exp.title}
                          </h5>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                            {exp.category || "General"}
                          </span>
                          {exp.isSettled ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <FaCheckCircle size={8} /> Settled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              Pending
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-gray-500 mt-1">
                          {isPayer ? (
                            <span>
                              You paid • <strong className="text-gray-800">{otherPerson.name}</strong> owes you
                            </span>
                          ) : (
                            <span>
                              <strong className="text-gray-800">{otherPerson.name}</strong> paid • You owe
                            </span>
                          )}
                        </p>

                        {exp.notes && (
                          <p className="text-[10px] text-gray-400 mt-0.5 italic">
                            {exp.notes}
                          </p>
                        )}

                        <p className="text-[9px] text-gray-400 mt-1.5">
                          {new Date(exp.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm font-extrabold ${
                            isPayer ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isPayer ? "+" : "-"}Rs.{exp.amount?.toFixed(2)}
                        </p>

                        <div className="flex items-center justify-end gap-1.5 mt-2">
                          {!exp.isSettled && (
                            <button
                              onClick={() => handleSettleSingle(exp.id)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition"
                              title="Mark as Settled"
                            >
                              <FaCheckCircle size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 rounded-lg bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition"
                            title="Delete Expense"
                          >
                            <FaTrashAlt size={11} />
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

      {/* Add Split Modal */}
      <AddSplitExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onExpenseAdded={loadSplitData}
        currentUser={user}
        defaultFriend={modalDefaultFriend}
      />

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
        onFriendAdded={handleFriendAdded}
        currentUser={user}
      />
    </section>
  );
};

export default SplitExpensesTab;
