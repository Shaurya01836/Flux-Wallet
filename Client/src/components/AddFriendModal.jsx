import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaUserPlus, FaSpinner, FaCheck, FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import api from "../api";

const AddFriendModal = ({ isOpen, onClose, onFriendAdded, currentUser }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Please enter your friend's name.");
      return;
    }

    if (email.trim() && !email.includes("@")) {
      setErrorMsg("Please enter a valid email address (e.g. friend@gmail.com).");
      return;
    }

    setIsSubmitting(true);
    try {
      const emailParam = email.trim() ? `&email=${encodeURIComponent(email.trim().toLowerCase())}` : "";
      const res = await api.post(
        `/api/split/add-friend?currentUserId=${currentUser.id}&name=${encodeURIComponent(
          name.trim()
        )}${emailParam}`
      );

      onFriendAdded(res.data);
      handleClose();
    } catch (err) {
      console.error("Failed to add friend", err);
      setErrorMsg(
        err.response?.data?.message || "Failed to add friend. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setErrorMsg("");
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-gray-900/40 backdrop-blur-md p-0 md:p-4 transition-all duration-300">
      <div className="bg-white w-full max-w-md md:rounded-[2rem] rounded-t-[2rem] p-6 shadow-2xl relative animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FaUserPlus size={18} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">Add a Friend</h2>
              <p className="text-xs text-gray-400">Split and track expenses right away</p>
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
              Friend's Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul, John Doe, Aman"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Email Address
              </label>
              <span className="text-[10px] text-gray-400 font-semibold lowercase italic">
                (optional — can link later)
              </span>
            </div>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. friend@gmail.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
              💡 Don't know their email yet? Leave it blank! You can record splits now, and link their email later to automatically sync all records when they join.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" /> Adding Friend...
                </>
              ) : (
                <>
                  <FaCheck /> Add Friend
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

export default AddFriendModal;
