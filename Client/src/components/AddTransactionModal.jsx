import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import api from "../api";
const AddTransactionModal = ({ isOpen, onClose, onTransactionAdded }) => {
  // Form State
  const [form, setForm] = useState({
    title: "",
    amount: "",
    type: "DEBIT", // Default to Expense
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Get User ID from Session
    const user = JSON.parse(localStorage.getItem("user_info"));
    if (!user || !user.id) {
      alert("User not logged in!");
      return;
    }

    try {
      // 2. Prepare Payload (Match Backend DTO)
      const payload = {
        userId: user.id,
        title: form.title,
        amount: parseFloat(form.amount), // Ensure it's a number
        type: form.type, // "CREDIT" or "DEBIT"
        description: "Added manually",
      };

      // 3. Send to Backend
      await api.post("/api/payments", payload);

      // 4. Cleanup & Refresh
      setForm({ title: "", amount: "", type: "DEBIT" }); // Reset form
      onTransactionAdded(); // Tell Dashboard to reload data
      onClose(); // Close modal
    } catch (error) {
      console.error("Failed to add payment", error);
      alert("Failed to save transaction.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Grocery"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-indigo-500 font-medium"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Amount
              </label>
              <input
                type="number"
                required
                step="0.01"
                placeholder="0.00"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-indigo-500 font-medium"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Type
              </label>
              <select
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-indigo-500 font-medium"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="DEBIT">Expense</option>
                <option value="CREDIT">Income</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition mt-4"
          >
            Save Transaction
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
