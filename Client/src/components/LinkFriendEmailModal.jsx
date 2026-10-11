import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaLink, FaSpinner, FaCheck } from "react-icons/fa";
import api from "../api";

const LinkFriendEmailModal = ({ isOpen, onClose, onLinked, currentUser, friend }) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !friend) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address (e.g. friend@gmail.com).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.put(
        `/api/split/link-email?currentUserId=${currentUser.id}&friendId=${
          friend.friendId || friend.id
        }&email=${encodeURIComponent(email.trim().toLowerCase())}`
      );

      if (onLinked) onLinked(res.data);
      handleClose();
    } catch (err) {
      console.error("Failed to link email", err);
      setErrorMsg(
        err.response?.data?.message || "Failed to link email. Please check and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setErrorMsg("");
    onClose();
  };

  const friendName = friend.friendName || friend.name || "Friend";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-gray-900/40 backdrop-blur-md p-0 md:p-4 transition-all duration-300">
      <div className="bg-white w-full max-w-md md:rounded-[2rem] rounded-t-[2rem] p-6 shadow-2xl relative animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FaLink size={18} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
                Link Email to {friendName}
              </h2>
              <p className="text-xs text-gray-400">Sync all transactions automatically</p>
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
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              {friendName}'s Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. friend@gmail.com"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 mt-2 text-[11px] text-indigo-900 leading-relaxed">
              ✨ <strong>Auto-Sync Guarantee:</strong> Once linked, if {friendName} already has an account or signs in later with Google using this email, all current and past split balances will automatically link to their profile!
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" /> Linking Email...
                </>
              ) : (
                <>
                  <FaCheck /> Link Email & Sync
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

export default LinkFriendEmailModal;
