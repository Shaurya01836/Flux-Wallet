import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaSearch, FaUserPlus, FaReceipt, FaMoneyBillWave, FaSpinner, FaCheck } from "react-icons/fa";
import api from "../api";

const AddSplitExpenseModal = ({ isOpen, onClose, onExpenseAdded, currentUser, defaultFriend = null }) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food & Dining");
  const [notes, setNotes] = useState("");

  // Payer: "YOU" or "FRIEND"
  const [paidByWho, setPaidByWho] = useState("YOU");

  // Friend search / selection
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(defaultFriend);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (defaultFriend) {
      setSelectedFriend(defaultFriend);
    }
  }, [defaultFriend]);

  useEffect(() => {
    if (!searchQuery.trim() || !currentUser) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/api/split/search-users?query=${encodeURIComponent(searchQuery.trim())}&currentUserId=${currentUser.id}`);
        setSearchResults(res.data || []);
      } catch (err) {
        console.error("Failed to search users", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMsg("Please enter a valid amount.");
      return;
    }

    if (!selectedFriend) {
      setErrorMsg("Please select a friend.");
      return;
    }

    if (!title.trim()) {
      setErrorMsg("Please enter an expense title.");
      return;
    }

    const friendId = selectedFriend.id || selectedFriend.friendId;
    const paidById = paidByWho === "YOU" ? currentUser.id : friendId;
    const owedById = paidByWho === "YOU" ? friendId : currentUser.id;

    setIsSubmitting(true);
    try {
      await api.post("/api/split/expense", {
        title: title.trim(),
        amount: Math.round(parsedAmount * 100) / 100,
        notes: notes.trim(),
        category,
        paidById,
        owedById,
      });

      onExpenseAdded();
      handleClose();
    } catch (err) {
      console.error("Failed to add split expense", err);
      setErrorMsg(err.response?.data?.message || "Failed to record expense. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setAmount("");
    setCategory("Food & Dining");
    setNotes("");
    setSearchQuery("");
    setPaidByWho("YOU");
    setErrorMsg("");
    onClose();
  };

  const friendName = selectedFriend?.name || selectedFriend?.friendName || "Friend";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-gray-900/40 backdrop-blur-md p-0 md:p-4 transition-all duration-300">
      <div className="bg-white w-full max-w-md md:rounded-[2rem] rounded-t-[2rem] p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FaReceipt size={18} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
                Split an Expense
              </h2>
              <p className="text-xs text-gray-400">Record a shared payment</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Friend Selection */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Friend
            </label>

            {selectedFriend ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {friendName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-900">{friendName}</p>
                    <p className="text-[10px] text-gray-500">{selectedFriend.email || selectedFriend.friendEmail}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFriend(null)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 focus-within:border-indigo-500 focus-within:bg-white transition">
                  <FaSearch className="text-gray-400 text-xs mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friend by name, email or mobile..."
                    className="bg-transparent w-full outline-none text-xs text-gray-900 placeholder-gray-400"
                  />
                  {isSearching && <FaSpinner className="animate-spin text-indigo-500 text-xs" />}
                </div>

                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-30 divide-y divide-gray-100">
                    {searchResults.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedFriend(u);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {u.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{u.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Title */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dinner, Movie tickets, Groceries..."
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* 3. Amount & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Amount (Rs.)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold text-xs">Rs.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-9 pr-3 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              >
                <option value="Food & Dining">Food & Dining</option>
                <option value="Transportation">Transportation</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Bills & Utilities">Bills & Utilities</option>
                <option value="Groceries">Groceries</option>
                <option value="Shopping">Shopping</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* 4. Who Paid? (Simple 2-way toggle switch) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Who Paid?
            </label>
            <div className="bg-gray-100 p-1 rounded-xl flex relative h-10">
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-all duration-300 ${
                  paidByWho === "YOU" ? "left-1" : "left-[calc(50%+4px)]"
                }`}
              ></div>
              <button
                type="button"
                onClick={() => setPaidByWho("YOU")}
                className={`flex-1 relative z-10 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                  paidByWho === "YOU" ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                I Paid (He owes me)
              </button>
              <button
                type="button"
                onClick={() => setPaidByWho("FRIEND")}
                className={`flex-1 relative z-10 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                  paidByWho === "FRIEND" ? "text-rose-600" : "text-gray-400"
                }`}
              >
                He Paid (I owe him)
              </button>
            </div>
          </div>

          {/* 5. Note (Optional) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Note (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via UPI / cash"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <FaCheck /> Save Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddSplitExpenseModal;
