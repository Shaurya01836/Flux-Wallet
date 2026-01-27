import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import api from "../api";

const AddTransactionModal = ({ isOpen, onClose, onTransactionAdded, transactionToEdit }) => {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    type: "DEBIT",
    category: "",    
    description: "", 
    date: "",
  });

  const defaultCategories = [
    "Food & Dining", "Shopping", "Transportation", "Bills & Utilities", 
    "Entertainment", "Health & Fitness", "Salary", "Freelance", "Investment", "Other"
  ];

  useEffect(() => {
    if (transactionToEdit) {
      setForm({
        title: transactionToEdit.title,
        amount: transactionToEdit.amount,
        type: transactionToEdit.type,
        category: transactionToEdit.category || "",       
        description: transactionToEdit.description || "", 
        // Keep only the YYYY-MM-DD part for the input field
        date: transactionToEdit.date ? transactionToEdit.date.split('T')[0] : "",
      });
    } else {
      // Default to today's date for new transactions
      const today = new Date().toISOString().split('T')[0];
      setForm({ title: "", amount: "", type: "DEBIT", category: "", description: "", date: today });
    }
  }, [transactionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("user_info"));
    if (!user) return;

    try {
      // --- FIX: Preserve Time Logic ---
      let datePayload = undefined;

      if (form.date) {
          // 1. Parse the input date (YYYY-MM-DD) components
          const [year, month, day] = form.date.split('-').map(Number);
          
          // 2. Determine the time to use
          let hours = 0, minutes = 0, seconds = 0;
          
          if (transactionToEdit && transactionToEdit.date) {
              // EDIT: Preserve the original time
              const original = new Date(transactionToEdit.date);
              hours = original.getHours();
              minutes = original.getMinutes();
              seconds = original.getSeconds();
          } else {
              // NEW: Use the current time (so it doesn't default to 00:00)
              const now = new Date();
              hours = now.getHours();
              minutes = now.getMinutes();
              seconds = now.getSeconds();
          }

          // 3. Construct new Date object (Month is 0-indexed in JS)
          const finalDate = new Date(year, month - 1, day, hours, minutes, seconds);
          
          // 4. Convert to ISO for API
          datePayload = finalDate.toISOString();
      }
      // --------------------------------

      const payload = {
        userId: user.id,
        title: form.title,
        amount: parseFloat(form.amount),
        type: form.type,
        category: form.category,         
        description: form.description,   
        date: datePayload
      };

      if (transactionToEdit) {
        // Delete old -> Create new (Backend Workaround)
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
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-slide-up max-h-[90vh] overflow-y-auto">
        
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
              placeholder="e.g. Starbucks"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-indigo-500 font-medium"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
            <input
              type="text"
              required
              list="category-suggestions" 
              placeholder="Select or type..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-indigo-500 font-medium"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <datalist id="category-suggestions">
                {defaultCategories.map((cat) => (
                    <option key={cat} value={cat} />
                ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
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
          
           <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
              <input
                type="date"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-indigo-500 font-medium text-gray-600"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Description <span className="text-gray-300 font-normal">(Optional)</span>
              </label>
              <textarea
                rows="2"
                placeholder="Add notes..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-indigo-500 font-medium resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition mt-2"
          >
            {transactionToEdit ? "Update Transaction" : "Save Transaction"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;