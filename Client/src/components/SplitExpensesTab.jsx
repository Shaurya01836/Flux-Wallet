import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
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
  FaLink,
  FaTimes,
  FaHourglassHalf,
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

  const handleSettleSingle = async (expense) => {
    const isPayer = expense.paidById === user?.id; // You are owed the money
    const hasIncomingRequest = expense.settleRequestedById && expense.settleRequestedById !== user?.id;

    let confirmMsg = "Mark this expense as settled?";
    if (!isPayer && !hasIncomingRequest) {
      confirmMsg = "You owe this amount. Send a settlement request to your friend to approve?";
    } else if (hasIncomingRequest) {
      confirmMsg = `Your friend requested to settle this. Accept and mark as settled?`;
    }

    const ok = await window.confirm(confirmMsg);
    if (!ok) return;

    try {
      await api.put(`/api/split/settle/${expense.id}?currentUserId=${user.id}`);
      loadSplitData();
    } catch (err) {
      console.error("Failed to settle expense", err);
      alert(err.response?.data?.message || "Failed to settle expense.");
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
    const ok = await window.confirm(`Settle pending balances with ${friendName}?`);
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

  const handleShareWhatsAppSingle = (exp) => {
    const isPayer = exp.paidById === user?.id;
    const otherPersonName = isPayer ? exp.owedByName || "Friend" : exp.paidByName || "Friend";
    const myName = user?.name || "Your Friend";
    const amountStr = `Rs. ${exp.amount?.toFixed(2) || "0.00"}`;
    const websiteUrl = window.location.origin.includes("localhost")
      ? "https://flux-wallet-secure.vercel.app"
      : window.location.origin;

    const text = `Hey ${otherPersonName}!\n\nJust shared a split expense with you on *Flux Wallet*:\n\n*Expense:* ${exp.title}\n*Amount:* ${amountStr}\n*Paid by:* ${isPayer ? myName : otherPersonName}\n*Category:* ${exp.category || "General"}\n\n*View & settle on Flux Wallet:*\n${websiteUrl}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Mobile sub-tab: "friends" or "activity"
  const [mobileSubTab, setMobileSubTab] = useState("friends");

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
              <p className="text-xs font-bold text-gray-700">No friends yet</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Click "Add Friend" above to add friends and start sharing bills!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredFriends.map((f) => {
                const isSelected = selectedFriend?.friendId === f.friendId;
                return (
                  <div
                    key={f.friendId}
                    onClick={() => {
                      setSelectedFriend(isSelected ? null : f);
                      // On mobile, switch to activity tab automatically when a friend is tapped
                      if (window.innerWidth < 1024) {
                        setMobileSubTab("activity");
                      }
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold text-gray-900 truncate">{f.friendName}</p>
                            {f.isOnboarded ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200" title="Joined on Flux">
                                <FaCheck size={7} /> Onboarded
                              </span>
                            ) : f.friendEmail?.includes("@offline.flux") ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200" title="Offline friend - link real email to sync">
                                Offline Profile
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200" title="Pending joining - split history is ready">
                                <FaClock size={7} /> Pending Invite
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 truncate">
                            {f.friendEmail?.includes("@offline.flux") ? "No email linked yet" : f.friendEmail}
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

                    {/* Action Bar (when selected) */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-indigo-100 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFriend(f.friendId, f.friendName);
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Delete Friend"
                          >
                            <FaTrashAlt size={10} />
                            <span>Delete</span>
                          </button>

                          {/* WhatsApp Share Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareWhatsAppForFriend(f);
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Share split summary with friend on WhatsApp"
                          >
                            <FaWhatsapp size={12} className="text-emerald-500" />
                            <span>Share</span>
                          </button>

                          {/* Link Email Button if not already joined or if offline */}
                          {!f.isOnboarded && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFriendToLinkEmail(f);
                                setIsLinkEmailModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl text-indigo-600 hover:bg-indigo-50 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Link / Update friend email so it syncs when they sign up"
                            >
                              <FaLink size={10} />
                              <span>{f.friendEmail?.includes("@offline.flux") ? "Link Email" : "Change Email"}</span>
                            </button>
                          )}
                        </div>

                        {f.netAmount !== 0 && (
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
                          ) : exp.settleRequestedById ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <FaHourglassHalf size={8} /> Settle Requested
                            </span>
                          ) : exp.deleteRequestedById ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              <FaTrashAlt size={8} /> Delete Requested
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

                        {/* Settlement Request Banner */}
                        {exp.settleRequestedById && !exp.isSettled && (
                          <div className="mt-2 p-2 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-2 flex-wrap text-[10px]">
                            <span className="text-indigo-800 font-semibold">
                              {exp.settleRequestedById === user?.id
                                ? "⏳ Waiting for friend to approve settlement"
                                : `📩 ${exp.settleRequestedByName || "Friend"} requested to settle this`}
                            </span>
                            {exp.settleRequestedById !== user?.id && (
                              <div className="flex items-center gap-1 ml-auto">
                                <button
                                  onClick={() => handleSettleSingle(exp)}
                                  className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer transition shadow-xs"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRejectSettle(exp.id)}
                                  className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold cursor-pointer transition"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Delete Request Banner */}
                        {exp.deleteRequestedById && !exp.isSettled && (
                          <div className="mt-2 p-2 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between gap-2 flex-wrap text-[10px]">
                            <span className="text-rose-800 font-semibold">
                              {exp.deleteRequestedById === user?.id
                                ? "⏳ Waiting for friend to approve deletion"
                                : `⚠️ ${exp.deleteRequestedByName || "Friend"} requested to delete this record`}
                            </span>
                            {exp.deleteRequestedById !== user?.id && (
                              <div className="flex items-center gap-1 ml-auto">
                                <button
                                  onClick={() => handleDeleteExpense(exp)}
                                  className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer transition shadow-xs"
                                >
                                  Confirm Delete
                                </button>
                                <button
                                  onClick={() => handleRejectDelete(exp.id)}
                                  className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold cursor-pointer transition"
                                >
                                  Keep Record
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {exp.notes && (
                          <p className="text-[10px] text-gray-400 mt-1 italic">
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
                            <>
                              <button
                                onClick={() => handleShareWhatsAppSingle(exp)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition cursor-pointer"
                                title="Share this expense on WhatsApp"
                              >
                                <FaWhatsapp size={12} />
                              </button>
                              <button
                                onClick={() => {
                                  setExpenseToEdit(exp);
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition cursor-pointer"
                                title="Edit Expense"
                              >
                                <FaPen size={11} />
                              </button>
                              <button
                                onClick={() => handleSettleSingle(exp)}
                                disabled={exp.settleRequestedById === user?.id}
                                className={`p-1.5 rounded-lg transition ${
                                  exp.settleRequestedById === user?.id
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 cursor-pointer"
                                }`}
                                title={
                                  isPayer
                                    ? "Mark as Settled"
                                    : exp.settleRequestedById === user?.id
                                    ? "Settlement requested - awaiting friend confirmation"
                                    : "Request friend to settle"
                                }
                              >
                                <FaCheckCircle size={12} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteExpense(exp)}
                            disabled={exp.deleteRequestedById === user?.id}
                            className={`p-1.5 rounded-lg transition ${
                              exp.deleteRequestedById === user?.id
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 cursor-pointer"
                            }`}
                            title={
                              exp.deleteRequestedById === user?.id
                                ? "Deletion requested - awaiting confirmation"
                                : "Delete Expense"
                            }
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
    </section>
  );
});

export default SplitExpensesTab;
