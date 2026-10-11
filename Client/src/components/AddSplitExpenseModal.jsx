import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaSearch, FaSpinner, FaCheck, FaUserFriends } from "react-icons/fa";
import api from "../api";

const AddSplitExpenseModal = ({
  isOpen,
  onClose,
  onExpenseAdded,
  currentUser,
  defaultFriend = null,
  expenseToEdit = null,
}) => {
  const [status, setStatus] = useState("IDLE"); // 'IDLE' | 'SUBMITTING' | 'SUCCESS'
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food & Dining");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");

  // Payer toggle: "YOU" (I Paid -> emerald) vs "FRIEND" (He Paid -> rose)
  const [paidByWho, setPaidByWho] = useState("YOU");

  // Friend selection
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(defaultFriend);
  const [errorMsg, setErrorMsg] = useState("");

  const defaultCategories = [
    "Food & Dining", "Shopping", "Transportation", "Bills & Utilities", 
    "Entertainment", "Health & Fitness", "Groceries", "Other"
  ];

  useEffect(() => {
    if (isOpen) {
      setStatus("IDLE");
      setErrorMsg("");

      if (expenseToEdit) {
        setTitle(expenseToEdit.title || "");
        setAmount(expenseToEdit.amount != null ? String(expenseToEdit.amount) : "");
        setCategory(expenseToEdit.category || "Food & Dining");
        setNotes(expenseToEdit.notes || "");
        setDate(
          expenseToEdit.createdAt
            ? expenseToEdit.createdAt.split("T")[0]
            : new Date().toISOString().split("T")[0]
        );

        const isPayer = expenseToEdit.paidById === currentUser?.id;
        setPaidByWho(isPayer ? "YOU" : "FRIEND");

        // Reconstitute friend from expenseToEdit
        const otherPerson = isPayer
          ? {
              id: expenseToEdit.owedById,
              name: expenseToEdit.owedByName,
              email: expenseToEdit.owedByEmail,
            }
          : {
              id: expenseToEdit.paidById,
              name: expenseToEdit.paidByName,
              email: expenseToEdit.paidByEmail,
            };
        setSelectedFriend(otherPerson);
      } else {
        setTitle("");
        setAmount("");
        setCategory("Food & Dining");
        setNotes("");
        setDate(new Date().toISOString().split("T")[0]);
        setPaidByWho("YOU");
        if (defaultFriend) {
          setSelectedFriend(defaultFriend);
        } else {
          setSelectedFriend(null);
        }
      }
    }
  }, [expenseToEdit, defaultFriend, isOpen, currentUser]);

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
    }, 250);

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
      setErrorMsg("Please select a friend to split with.");
      return;
    }

    if (!title.trim()) {
      setErrorMsg("Please enter an expense title.");
      return;
    }

    const friendId = selectedFriend.id || selectedFriend.friendId;
    const paidById = paidByWho === "YOU" ? currentUser.id : friendId;
    const owedById = paidByWho === "YOU" ? friendId : currentUser.id;

    setStatus("SUBMITTING");
    try {
      let createdAtPayload = undefined;
      if (date) {
        const [year, month, day] = date.split("-").map(Number);
        let hours = 12, minutes = 0, seconds = 0;
        if (expenseToEdit && expenseToEdit.createdAt) {
          const original = new Date(expenseToEdit.createdAt);
          hours = original.getHours();
          minutes = original.getMinutes();
          seconds = original.getSeconds();
        } else {
          const now = new Date();
          hours = now.getHours();
          minutes = now.getMinutes();
          seconds = now.getSeconds();
        }
        const finalDate = new Date(year, month - 1, day, hours, minutes, seconds);
        createdAtPayload = finalDate.toISOString();
      }

      const payload = {
        title: title.trim(),
        amount: Math.round(parsedAmount * 100) / 100,
        notes: notes.trim(),
        category,
        paidById,
        owedById,
        createdAt: createdAtPayload,
      };

      if (expenseToEdit) {
        await api.put(`/api/split/expense/${expenseToEdit.id}?currentUserId=${currentUser.id}`, payload);
      } else {
        await api.post("/api/split/expense", payload);
      }

      setStatus("SUCCESS");
      setTimeout(() => {
        onExpenseAdded();
        handleClose();
      }, 700);
    } catch (err) {
      console.error("Failed to save split expense", err);
      setErrorMsg(err.response?.data?.message || "Failed to record expense. Try again.");
      setStatus("IDLE");
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
    setStatus("IDLE");
    onClose();
  };

  const friendName = selectedFriend?.name || selectedFriend?.friendName || "Friend";
  const isIPaid = paidByWho === "YOU";
  const activeColor = isIPaid ? "text-emerald-500" : "text-rose-500";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-gray-900/40 backdrop-blur-md transition-all duration-300">
      <div className="bg-white w-full max-w-md md:rounded-[2rem] rounded-t-[2rem] p-6 shadow-2xl relative animate-slide-up">
        {/* Compact Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <FaUserFriends className="text-indigo-600 text-base" />
            <span>{expenseToEdit ? "Edit Split Expense" : "Split Expense"}</span>
          </h2>
          <button
            onClick={handleClose}
            disabled={status !== "IDLE"}
            className="p-2 -mr-2 text-gray-300 hover:text-gray-900 transition-colors rounded-full cursor-pointer"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Toggle Switch (Matching New Entry Style) */}
          <div className="bg-gray-100 p-1 rounded-xl flex relative h-10">
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-all duration-300 ${
                isIPaid ? "left-1" : "left-[calc(50%+4px)]"
              }`}
            ></div>
            <button
              type="button"
              onClick={() => setPaidByWho("YOU")}
              className={`flex-1 relative z-10 text-xs font-bold uppercase tracking-wider transition-colors duration-300 cursor-pointer ${
                isIPaid ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              I Paid (He owes)
            </button>
            <button
              type="button"
              onClick={() => setPaidByWho("FRIEND")}
              className={`flex-1 relative z-10 text-xs font-bold uppercase tracking-wider transition-colors duration-300 cursor-pointer ${
                !isIPaid ? "text-rose-600" : "text-gray-400"
              }`}
            >
              He Paid (I owe)
            </button>
          </div>

          {/* 2. Hero Amount (Matching New Entry Style) */}
          <div className="text-center py-1">
            <div className="flex items-center justify-center gap-1">
              <span className={`text-2xl font-bold transition-colors duration-300 ${activeColor} opacity-50`}>
                Rs.
              </span>
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                placeholder="0"
                autoFocus
                className={`w-44 bg-transparent text-5xl font-extrabold text-gray-900 text-center outline-none placeholder-gray-200 tabular-nums caret-${
                  isIPaid ? "emerald-500" : "rose-500"
                }`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* 3. Friend Selection Field */}
          <div>
            {selectedFriend ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {friendName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-gray-900 truncate">
                      With: <span className="text-indigo-600">{friendName}</span>
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {selectedFriend.email?.includes("@offline.flux")
                        ? "Offline profile"
                        : selectedFriend.email || selectedFriend.friendEmail}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFriend(null)}
                  className="text-[11px] text-gray-500 hover:text-indigo-600 font-bold px-2 py-1 cursor-pointer transition"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center bg-gray-50 rounded-xl px-4 py-2.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-gray-100 transition">
                  <FaSearch className="text-gray-400 text-xs mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Select or search friend..."
                    className="bg-transparent w-full outline-none text-xs font-bold text-gray-900 placeholder-gray-400"
                  />
                  {isSearching && <FaSpinner className="animate-spin text-indigo-500 text-xs" />}
                </div>

                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-40 overflow-y-auto z-30 divide-y divide-gray-100">
                    {searchResults.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedFriend(u);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="flex items-center gap-2.5 p-2.5 hover:bg-gray-50 cursor-pointer transition"
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {u.name?.charAt(0) || "U"}
                        </div>
                        <div className="min-w-0 flex-1">
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

          {/* 4. Title */}
          <input
            type="text"
            required
            placeholder="Title (e.g. Dinner, Movie tickets)"
            className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100 transition-all outline-none text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* 5. Grid for Category & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-sm text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-gray-100 cursor-pointer transition appearance-none"
              >
                {defaultCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 text-xs">
                ▼
              </div>
            </div>

            <input
              type="date"
              required
              className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-sm text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-gray-100 text-center"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* 6. Note (Optional) */}
          <input
            type="text"
            placeholder="Note (Optional e.g. paid cash / UPI)"
            className="w-full bg-gray-50 rounded-xl px-4 py-3 font-medium text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-gray-100"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* 7. Action Button (Matching New Entry Style) */}
          <button
            type="submit"
            disabled={status !== "IDLE"}
            className={`w-full py-3.5 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              status === "SUCCESS" ? "bg-green-500 text-white shadow-none" : ""
            } ${status === "SUBMITTING" ? "bg-gray-100 text-gray-400 cursor-wait" : ""} ${
              status === "IDLE"
                ? "bg-gray-900 text-white hover:bg-black hover:scale-[1.01] shadow-lg shadow-gray-200"
                : ""
            }`}
          >
            {status === "SUBMITTING" && <FaSpinner className="animate-spin" />}
            {status === "SUCCESS" && <FaCheck className="animate-bounce-short" />}
            <span>
              {status === "SUBMITTING"
                ? "Saving..."
                : status === "SUCCESS"
                ? "Saved!"
                : expenseToEdit
                ? "Update Split"
                : "Save Split"}
            </span>
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddSplitExpenseModal;
