import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import api from "../api";

const AddTransactionModal = ({ isOpen, onClose, onTransactionAdded, transactionToEdit }) => {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    type: "DEBIT",
    date: "", // New: Allow editing date
  });

  // Populate form if editing
  useEffect(() => {
    if (transactionToEdit) {
      setForm({
        title: transactionToEdit.title,
        amount: transactionToEdit.amount,
        type: transactionToEdit.type,
        date: transactionToEdit.date ? transactionToEdit.date.split('T')[0] : "",
      });
    } else {
      setForm({ title: "", amount: "", type: "DEBIT", date: "" });
    }
  }, [transactionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("user_info"));
    if (!user) return;

    try {
      const payload = {
        userId: user.id,
        title: form.title,
        amount: parseFloat(form.amount),
        type: form.type,
        description: "Updated transaction",
        date: form.date ? new Date(form.date).toISOString() : undefined
      };

      if (transactionToEdit) {
        // WORKAROUND: Delete old -> Create new (Since backend has no PUT yet)
        await api.delete(`/api/payments/${transactionToEdit.id}`);
      }

      await api.post("/api/payments", payload);

      onTransactionAdded();
      onClose();
    } catch (error) {
      console.error("Operation failed", error);
      alert("Failed to save transaction.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {transactionToEdit ? "Edit Transaction" : "New Transaction"}
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
            <input
              type="text"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-indigo-500 font-medium"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
              <input
                type="number"
                required
                step="0.01"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-indigo-500 font-medium"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
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
          
           {/* Date Picker (Optional) */}
           <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
              <input
                type="date"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-indigo-500 font-medium text-gray-600"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition mt-4"
          >
            {transactionToEdit ? "Update Transaction" : "Save Transaction"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;