import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
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
  FaInfoCircle,
  FaArrowUp,
  FaArrowDown,
  FaSync,
  FaUserPlus,
  FaCheck,
  FaClock,
  FaLink,
  FaTimes,
  FaHourglassHalf,
  FaCalendarAlt,
  FaTag,
  FaAlignLeft,
  FaPen,
  FaWhatsapp,
} from "react-icons/fa";
import api from "../api";
import AddSplitExpenseModal from "./AddSplitExpenseModal";
import AddFriendModal from "./AddFriendModal";
import LinkFriendEmailModal from "./LinkFriendEmailModal";

const SplitExpensesTab = forwardRef(({ user, onSplitActivity }, ref) => {
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
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isLinkEmailModalOpen, setIsLinkEmailModalOpen] = useState(false);
  const [friendToLinkEmail, setFriendToLinkEmail] = useState(null);
  const [modalDefaultFriend, setModalDefaultFriend] = useState(null);
  const [isSettling, setIsSettling] = useState(false);

  useImperativeHandle(ref, () => ({
    openAddExpenseModal: () => {
      setExpenseToEdit(null);
      setModalDefaultFriend(selectedFriend || null);
      setIsModalOpen(true);
    },
  }));

  const loadSplitData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [balRes, expRes] = await Promise.all([
        api.get(`/api/split/balances/${user.id}`),
        api.get(`/api/split/user/${user.id}`),
      ]);
      const balData = balRes.data || { totalOwedToYou: 0, totalYouOwe: 0, netBalance: 0, friends: [] };
      setBalances(balData);
      setExpenses(expRes.data || []);
      if (onSplitActivity) {
        onSplitActivity(balData);
      }
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

  const handleRejectSettle = async (expenseId) => {
    const ok = await window.confirm("Decline this settlement request?");
    if (!ok) return;
    try {
      await api.put(`/api/split/settle/${expenseId}/reject?currentUserId=${user.id}`);
      loadSplitData();
    } catch (err) {
      console.error("Failed to reject settlement", err);
      alert("Failed to decline settlement request.");
    }
  };

  const handleSettleAllWithFriend = async (friendId, friendName) => {
    const friend = balances.friends?.find((f) => f.friendId === friendId);
    const net = friend?.netAmount || 0;
    const hasPending =
      (expenses || []).some(
        (exp) =>
          !exp.isSettled &&
          ((exp.paidById === user?.id && exp.owedById === friendId) ||
            (exp.owedById === user?.id && exp.paidById === friendId))
      );

    let confirmMsg = `Settle pending balances with ${friendName}?`;
    if (friend?.friendEmail?.endsWith?.("@offline.flux") || friend?.isOnboarded === false) {
      // friend may be offline; keep generic
    }
    if (net > 0) {
      confirmMsg = `${friendName} owes you Rs. ${net.toFixed(2)}. Settle all balances now?`;
    } else if (net < 0) {
      confirmMsg = `You owe ${friendName} Rs. ${Math.abs(net).toFixed(2)}. Send a settlement request for their approval?`;
    } else if (hasPending) {
      confirmMsg = `Settle all pending expenses with ${friendName}?`;
    }

    const ok = await window.confirm(confirmMsg);
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

  const handleDeleteExpense = async (expense) => {
    const hasIncomingDelete = expense.deleteRequestedById && expense.deleteRequestedById !== user?.id;
    let confirmMsg = "Delete this expense record?";
    if (!expense.isSettled && !hasIncomingDelete) {
      confirmMsg = "Request deletion of this active split expense? The other person will need to approve.";
    } else if (hasIncomingDelete) {
      confirmMsg = "Your friend requested to delete this expense. Confirm and permanently remove it?";
    }

    const ok = await window.confirm(confirmMsg);
    if (!ok) return;

    try {
      await api.delete(`/api/split/expense/${expense.id}?currentUserId=${user.id}`);
      loadSplitData();
    } catch (err) {
      console.error("Failed to delete expense", err);
      alert(err.response?.data?.message || "Failed to delete expense.");
    }
  };

  const handleRejectDelete = async (expenseId) => {
    const ok = await window.confirm("Decline this deletion request?");
    if (!ok) return;
    try {
      await api.put(`/api/split/expense/${expenseId}/reject-delete?currentUserId=${user.id}`);
      loadSplitData();
    } catch (err) {
      console.error("Failed to decline delete request", err);
      alert("Failed to decline deletion request.");
    }
  };

  const handleDeleteFriend = async (friendId, friendName) => {
    const ok = await window.confirm(
      `Remove ${friendName} from your friends list? Your transaction history and split records will be safely preserved.`
    );
    if (!ok) return;
    try {
      await api.delete(`/api/split/friend?currentUserId=${user.id}&friendId=${friendId}`);
      if (selectedFriend?.friendId === friendId) {
        setSelectedFriend(null);
      }
      loadSplitData();
    } catch (err) {
      console.error("Failed to delete friend", err);
      alert("Failed to delete friend.");
    }
  };

  // --- WhatsApp Sharing Helper ---
  const handleShareWhatsAppForFriend = (friend) => {
    if (!friend) return;
    const friendName = friend.friendName || "Friend";
    const myName = user?.name || "Your Friend";
    const net = friend.netAmount || 0;
    const isOwed = net > 0; // friend owes you
    const isDebt = net < 0; // you owe friend

    // Gather unsettled transactions with this friend
    const friendTxns = expenses.filter(
      (e) =>
        !e.isSettled &&
        ((e.paidById === friend.friendId && e.owedById === user?.id) ||
         (e.owedById === friend.friendId && e.paidById === user?.id))
    );

    let statusLine = "";
    if (isOwed) {
      statusLine = `*Pending Balance:* You owe *Rs. ${net.toFixed(2)}* to ${myName}.`;
    } else if (isDebt) {
      statusLine = `*Pending Balance:* ${myName} owes you *Rs. ${Math.abs(net).toFixed(2)}*.`;
    } else {
      statusLine = `All clear! We are fully settled up (Rs. 0.00).`;
    }

    let itemsList = "";
    if (friendTxns.length > 0) {
      itemsList = "\n\n*Pending Splits Breakdown:*\n" + friendTxns
        .slice(0, 5)
        .map((t) => {
          const whoPaid = t.paidById === user?.id ? "Paid by " + myName : "Paid by " + friendName;
          return `• *${t.title}* - Rs. ${t.amount.toFixed(2)} (${whoPaid})`;
        })
        .join("\n");
      if (friendTxns.length > 5) {
        itemsList += `\n...and ${friendTxns.length - 5} more transactions.`;
      }
    }

    const websiteUrl = window.location.origin.includes("localhost")
      ? "https://flux-wallet-secure.vercel.app"
      : window.location.origin;

    let emailLine = "";
    if (friend.friendEmail && !friend.friendEmail.includes("@offline.flux")) {
      emailLine = `\n*Linked Email:* ${friend.friendEmail}\n(Sign in with this Google account to instantly see and settle this bill!)`;
    }

    const appLinkNote = `\n\n*View details & settle on Flux Wallet:*\n${websiteUrl}${emailLine}`;

    const text = `Hey ${friendName}!\n\nHere is our latest split summary on *Flux Wallet*:\n\n${statusLine}${itemsList}${appLinkNote}\n\nCheers!`;

    // Copy formatted text to clipboard as seamless backup for desktop/web
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }

    const phone = friend.friendPhoneNumber ? friend.friendPhoneNumber.replace(/\D/g, "") : "";
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(url, "_blank");
  };

  // Mobile sub-tab: "friends" or "activity"
  const [mobileSubTab, setMobileSubTab] = useState("friends");
  const [detailExpense, setDetailExpense] = useState(null);

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

  const getDateLabel = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" });
  };

  const groupedExpenses = useMemo(() => {
    const groups = {};
    displayedExpenses.forEach((exp) => {
      const d = new Date(exp.createdAt.endsWith("Z") ? exp.createdAt : exp.createdAt + "Z");
      const dateKey = d.toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(exp);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [displayedExpenses]);
  return (
    <section className="pb-10 animate-fade-in space-y-6 sm:space-y-8">
      {/* Tab Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <FaUserFriends className="text-indigo-600 shrink-0" /> Split with Friends
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Share and settle expenses with friends just like Splitwise
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddFriendModalOpen(true)}
            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
            title="Add a friend by email"
          >
            <FaUserPlus className="text-[10px]" /> Add Friend
          </button>

          <button
            onClick={loadSplitData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-800 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Refresh balances"
          >
            <FaSync className={`text-[10px] ${isLoading ? "animate-spin text-indigo-500" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>



      {/* Mobile Switcher (visible only on mobile lg:hidden) */}
      <div className="flex lg:hidden bg-gray-200/60 p-1 rounded-xl text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setMobileSubTab("friends")}
          className={`flex-1 py-2 text-center rounded-lg transition ${
            mobileSubTab === "friends" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500"
          }`}
        >
          Friends ({filteredFriends.length})
        </button>
        <button
          onClick={() => setMobileSubTab("activity")}
          className={`flex-1 py-2 text-center rounded-lg transition ${
            mobileSubTab === "activity" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500"
          }`}
        >
          Activity ({displayedExpenses.length})
        </button>
      </div>

      {/* Grid: Friends Breakdown on Left / Expense Feed on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Friends with Balances */}
        <div
          className={`lg:col-span-5 bg-white rounded-2xl sm:rounded-[1.5rem] border border-gray-100 p-4 sm:p-5 shadow-sm space-y-4 ${
            mobileSubTab === "activity" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <FaUserFriends className="text-indigo-600" />
              <span>Friends</span>
              <span className="hidden lg:inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
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
              <p className="text-xs font-bold text-gray-700">No friends yet</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Click "Add Friend" above to add friends and start sharing bills!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[320px] sm:max-h-[460px] overflow-y-auto pr-1">
              {filteredFriends.map((f) => {
                const isSelected = selectedFriend?.friendId === f.friendId;
                return (
                  <div
                    key={f.friendId}
                    onClick={() => {
                      setSelectedFriend(isSelected ? null : f);
                    }}
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
                          <p className="text-xs font-bold text-gray-900 truncate">{f.friendName}</p>
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

                    {/* Dropdown detail view (expanded under the selected friend row) */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-indigo-100 space-y-3 animate-fade-in">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[11px] text-gray-400 truncate">
                            {f.friendEmail?.includes("@offline.flux") ? "No email linked yet" : f.friendEmail}
                          </p>
                          {f.isOnboarded ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <FaCheck size={7} /> Onboarded
                            </span>
                          ) : f.friendEmail?.includes("@offline.flux") ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Offline Profile
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              <FaClock size={7} /> Pending Invite
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="rounded-xl bg-white/70 border border-gray-100 p-2.5">
                            <p className="text-gray-400 font-bold uppercase tracking-wider">You paid for them</p>
                            <p className="font-extrabold text-gray-900">Rs. {Number(f.youPaidForThem || 0).toFixed(2)}</p>
                          </div>
                          <div className="rounded-xl bg-white/70 border border-gray-100 p-2.5">
                            <p className="text-gray-400 font-bold uppercase tracking-wider">They paid for you</p>
                            <p className="font-extrabold text-gray-900">Rs. {Number(f.theyPaidForYou || 0).toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.innerWidth < 1024) {
                                setMobileSubTab("activity");
                              }
                            }}
                            className="lg:hidden px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                          >
                            <FaReceipt size={10} />
                            <span>Open Activity</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareWhatsAppForFriend(f);
                            }}
                            className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <FaWhatsapp size={12} className="text-emerald-500" />
                            <span>Share</span>
                          </button>
                          {!f.isOnboarded && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFriendToLinkEmail(f);
                                setIsLinkEmailModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <FaLink size={10} />
                              <span>{f.friendEmail?.includes("@offline.flux") ? "Link Email" : "Change Email"}</span>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFriend(f.friendId, f.friendName);
                            }}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <FaTrashAlt size={10} />
                            <span>Delete</span>
                          </button>
                          {(f.netAmount !== 0 ||
                            (expenses || []).some(
                              (exp) =>
                                !exp.isSettled &&
                                ((exp.paidById === user?.id && exp.owedById === f.friendId) ||
                                  (exp.owedById === user?.id && exp.paidById === f.friendId))
                            )) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSettleAllWithFriend(f.friendId, f.friendName);
                              }}
                              disabled={isSettling}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer ml-auto"
                            >
                              <FaCheckDouble size={10} />
                              <span>Settle All</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Friend details are now shown as a dropdown directly under the selected friend row */}

        </div>

        {/* Right Column: Expense Activities */}
        <div
          className={`lg:col-span-7 bg-white rounded-2xl sm:rounded-[1.5rem] border border-gray-100 p-4 sm:p-5 shadow-sm space-y-4 ${
            mobileSubTab === "friends" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
              <div>
                <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <FaReceipt className="text-indigo-600 shrink-0" />
                  <span className="truncate">
                    {selectedFriend ? `With ${selectedFriend.friendName}` : "Expense Activity"}
                  </span>
                </h4>
                <p className="text-[11px] text-gray-400">
                  {displayedExpenses.length} transaction{displayedExpenses.length === 1 ? "" : "s"}
                </p>
              </div>

              {selectedFriend && (
                <button
                  onClick={() => handleShareWhatsAppForFriend(selectedFriend)}
                  className="px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95 shrink-0"
                  title="Share summary on WhatsApp"
                >
                  <FaWhatsapp size={13} className="text-emerald-500" />
                  <span>WhatsApp Summary</span>
                </button>
              )}
            </div>

            {/* Filter buttons - scrollable on mobile */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-[10px] sm:text-[11px] overflow-x-auto">
              <button
                onClick={() => setActiveFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                  activeFilter === "ALL"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter("OWED_TO_ME")}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                  activeFilter === "OWED_TO_ME"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Owed to me
              </button>
              <button
                onClick={() => setActiveFilter("I_OWE")}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                  activeFilter === "I_OWE"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                I owe
              </button>
              <button
                onClick={() => setActiveFilter("SETTLED")}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
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
            <div className="max-h-[320px] sm:max-h-[460px] overflow-y-auto pr-1">
              {groupedExpenses.map(([dateKey, groupItems]) => (
                <div key={dateKey} className="relative mb-6 last:mb-0">
                  <div className="py-2 mb-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-md inline-block">
                      {getDateLabel(dateKey)}
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {groupItems.map((exp) => {
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
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-xs text-gray-900 truncate">
                              {exp.title}
                            </h5>
                          </div>
                          {exp.category === "Settlement" && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Settled All
                            </span>
                          )}
                          {exp.category === "Settlement Request" && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Settle All Requested
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest truncate">
                          {exp.category || "General"}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-1.5">
                          {isPayer ? `${otherPerson.name} owes you` : `You owe ${otherPerson.name}`}
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailExpense(exp);
                          }}
                          className="p-2 text-gray-300 hover:text-blue-500 transition hover:bg-blue-50 rounded-md"
                          title="Details"
                        >
                          <FaInfoCircle size={12} />
                        </button>
                        </div>
                      </div>
                    </div>
                );
              })}
            </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Split Modal */}
      <AddSplitExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setExpenseToEdit(null);
        }}
        onExpenseAdded={loadSplitData}
        currentUser={user}
        defaultFriend={modalDefaultFriend}
        expenseToEdit={expenseToEdit}
      />

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
        onFriendAdded={handleFriendAdded}
        currentUser={user}
      />

      {/* Link Friend Email Modal */}
      <LinkFriendEmailModal
        isOpen={isLinkEmailModalOpen}
        onClose={() => {
          setIsLinkEmailModalOpen(false);
          setFriendToLinkEmail(null);
        }}
        onLinked={() => {
          loadSplitData();
          if (selectedFriend && friendToLinkEmail && selectedFriend.friendId === friendToLinkEmail.friendId) {
            setSelectedFriend(null);
          }
        }}
        currentUser={user}
        friend={friendToLinkEmail}
      />

      {/* Split Expense Detail Modal */}
      {detailExpense && createPortal((() => {
        const isPayer = detailExpense.paidById === user?.id;
        const otherPerson = isPayer
          ? { name: detailExpense.owedByName, email: detailExpense.owedByEmail }
          : { name: detailExpense.paidByName, email: detailExpense.paidByEmail };
        const formattedDate = new Date(
          detailExpense.createdAt.endsWith("Z") ? detailExpense.createdAt : detailExpense.createdAt + "Z"
        ).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/25 backdrop-blur-sm animate-fade-in"
            onClick={() => setDetailExpense(null)}
          >
            <div
              className="bg-white rounded-3xl w-[92%] max-w-xs sm:max-w-sm max-h-[80vh] overflow-y-auto shadow-2xl transform transition-all animate-scale-up border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative p-6 pb-8 text-center bg-gray-50 border-b border-gray-100">
                <button
                  onClick={() => setDetailExpense(null)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <FaTimes size={14} />
                </button>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{detailExpense.title}</h2>
                <p className="text-sm font-bold tracking-widest uppercase text-gray-400">
                  {detailExpense.category || "General"}
                </p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Amount</p>
                  <p className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isPayer ? "text-emerald-500" : "text-gray-900"}`}>
                    {isPayer ? "+" : "-"} Rs.{detailExpense.amount?.toFixed(2)}
                  </p>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                      <FaCalendarAlt size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date & Time</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">{formattedDate}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                      <FaTag size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Friend</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {otherPerson.name}
                        {isPayer ? " owes you" : " paid • you owe"}
                      </p>
                    </div>
                  </div>

                  {detailExpense.notes && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                        <FaAlignLeft size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notes</p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5 whitespace-pre-wrap">
                          {detailExpense.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                      <FaTag size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {detailExpense.isSettled
                          ? "Settled"
                          : detailExpense.settleRequestedById
                          ? "Settle Requested"
                          : detailExpense.deleteRequestedById
                          ? "Delete Requested"
                          : "Pending"}
                      </p>
                    </div>
                  </div>

                  {/* Settlement Request Banner */}
                  {detailExpense.settleRequestedById && !detailExpense.isSettled && (
                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[10px] space-y-2">
                      <span className="text-indigo-800 font-semibold block">
                        {detailExpense.settleRequestedById === user?.id
                          ? "⏳ Waiting for friend to approve settlement"
                          : `📩 ${detailExpense.settleRequestedByName || "Friend"} requested to settle this`}
                      </span>
                      {detailExpense.settleRequestedById !== user?.id && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const fid = detailExpense.paidById === user?.id ? detailExpense.owedById : detailExpense.paidById;
                              const fname = detailExpense.paidById === user?.id ? detailExpense.owedByName : detailExpense.paidByName;
                              handleSettleAllWithFriend(fid, fname);
                              setDetailExpense(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                          >
                            Accept All
                          </button>
                          <button
                            onClick={() => {
                              handleRejectSettle(detailExpense.id);
                              setDetailExpense(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delete Request Banner */}
                  {detailExpense.deleteRequestedById && !detailExpense.isSettled && (
                    <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-[10px] space-y-2">
                      <span className="text-rose-800 font-semibold block">
                        {detailExpense.deleteRequestedById === user?.id
                          ? "⏳ Waiting for friend to approve deletion"
                          : `⚠️ ${detailExpense.deleteRequestedByName || "Friend"} requested to delete this record`}
                      </span>
                      {detailExpense.deleteRequestedById !== user?.id && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              handleDeleteExpense(detailExpense);
                              setDetailExpense(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
                          >
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => {
                              handleRejectDelete(detailExpense.id);
                              setDetailExpense(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold"
                          >
                            Keep Record
                          </button>
                        </div>
                      )}
                    </div>
                  )}
              </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                {!detailExpense.isSettled && (
                  <button
                    onClick={() => {
                      setExpenseToEdit(detailExpense);
                      setIsModalOpen(true);
                      setDetailExpense(null);
                    }}
                    className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => {
                    handleDeleteExpense(detailExpense);
                    setDetailExpense(null);
                  }}
                  className="flex-1 py-2.5 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-colors shadow-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDetailExpense(null)}
                  className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })(), document.body)}
    </section>
  );
});

export default SplitExpensesTab;
