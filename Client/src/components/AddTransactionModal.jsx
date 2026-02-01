import React, { useState, useEffect } from "react";
import { FaTimes, FaSpinner, FaCheck } from "react-icons/fa";
import api from "../api";

const AddTransactionModal = ({ isOpen, onClose, onTransactionAdded, transactionToEdit }) => {
  const [status, setStatus] = useState("IDLE"); // 'IDLE' | 'SUBMITTING' | 'SUCCESS'
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
    if (isOpen) {
      setStatus("IDLE");
      if (transactionToEdit) {
        setForm({
          title: transactionToEdit.title,
          amount: transactionToEdit.amount,
          type: transactionToEdit.type,
          category: transactionToEdit.category || "",       
          description: transactionToEdit.description || "", 
          date: transactionToEdit.date ? transactionToEdit.date.split('T')[0] : "",
        });
      } else {
        const today = new Date().toISOString().split('T')[0];
        setForm({ title: "", amount: "", type: "DEBIT", category: "", description: "", date: today });
      }
    }
  }, [transactionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("user_info"));
    if (!user) return;

    setStatus("SUBMITTING");

    try {
      let datePayload = undefined;
      if (form.date) {
          const [year, month, day] = form.date.split('-').map(Number);
          let hours = 0, minutes = 0, seconds = 0;
          if (transactionToEdit && transactionToEdit.date) {
              const original = new Date(transactionToEdit.date);
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
          datePayload = finalDate.toISOString();
      }

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
        await api.delete(`/api/payments/${transactionToEdit.id}`);
      }

      await api.post("/api/payments", payload);

      setStatus("SUCCESS");
      setTimeout(() => {
        onTransactionAdded();
        onClose();
      }, 1000);

    } catch (error) {
      console.error("Operation failed", error);
      alert("Failed to save transaction.");
      setStatus("IDLE");
    }
  };

  const isExpense = form.type === 'DEBIT';
  const activeColor = isExpense ? 'text-rose-500' : 'text-emerald-500';

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-gray-900/40 backdrop-blur-md transition-all duration-300">
      
      {/* Container: Removed max-h and overflow to prevent scrolling */}
      <div className="bg-white w-full max-w-md md:rounded-[2rem] rounded-t-[2rem] p-6 shadow-2xl relative animate-slide-up">
        
        {/* Compact Header */}
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
                {transactionToEdit ? "Edit Entry" : "New Entry"}
            </h2>
            <button 
                onClick={onClose} 
                disabled={status !== 'IDLE'}
                className="p-2 -mr-2 text-gray-300 hover:text-gray-900 transition-colors rounded-full"
            >
                <FaTimes size={18} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* 1. Toggle Switch (Compact) */}
            <div className="bg-gray-100 p-1 rounded-xl flex relative h-10">
                <div 
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-all duration-300 ${isExpense ? 'left-1' : 'left-[calc(50%+4px)]'}`}
                ></div>
                <button
                    type="button"
                    onClick={() => setForm({...form, type: 'DEBIT'})}
                    className={`flex-1 relative z-10 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isExpense ? 'text-rose-600' : 'text-gray-400'}`}
                >
                    Expense
                </button>
                <button
                    type="button"
                    onClick={() => setForm({...form, type: 'CREDIT'})}
                    className={`flex-1 relative z-10 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${!isExpense ? 'text-emerald-600' : 'text-gray-400'}`}
                >
                    Income
                </button>
            </div>

            {/* 2. Hero Amount (Integrated) */}
            <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                    <span className={`text-2xl font-bold transition-colors duration-300 ${activeColor} opacity-50`}>Rs.</span>
                    <input
                        type="number"
                        required
                        step="0.01"
                        placeholder="0"
                        autoFocus={!transactionToEdit}
                        className={`w-40 bg-transparent text-5xl font-extrabold text-gray-900 text-center outline-none placeholder-gray-200 tabular-nums caret-${isExpense ? 'rose-500' : 'emerald-500'}`}
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                </div>
            </div>

            {/* 3. Fields (Tighter Spacing) */}
            <div className="space-y-3">
                {/* Title */}
                <input
                    type="text"
                    required
                    placeholder="Title (e.g. Lunch)"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100 transition-all outline-none"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                />

                {/* Grid for Category & Date */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            required
                            list="category-suggestions" 
                            placeholder="Category"
                            className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-gray-100"
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                        />
                         <datalist id="category-suggestions">
                            {defaultCategories.map((cat) => (
                                <option key={cat} value={cat} />
                            ))}
                        </datalist>
                    </div>

                    <input
                        type="date"
                        required
                        className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-sm text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-gray-100 text-center"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                </div>

                {/* Note */}
                <input
                    type="text"
                    placeholder="Note (Optional)"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 font-medium text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-gray-100"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
            </div>

            {/* 4. Action Button */}
            <button
                type="submit"
                disabled={status !== 'IDLE'}
                className={`
                    w-full py-3.5 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2
                    ${status === 'SUCCESS' ? 'bg-green-500 text-white shadow-none' : ''}
                    ${status === 'SUBMITTING' ? 'bg-gray-100 text-gray-400 cursor-wait' : ''}
                    ${status === 'IDLE' ? 'bg-gray-900 text-white hover:bg-black hover:scale-[1.01] shadow-lg shadow-gray-200' : ''}
                `}
            >
                {status === 'SUBMITTING' && <FaSpinner className="animate-spin" />}
                {status === 'SUCCESS' && <FaCheck className="animate-bounce-short" />}
                <span>
                    {status === 'SUBMITTING' ? 'Saving...' : 
                     status === 'SUCCESS' ? 'Saved!' : 
                     transactionToEdit ? 'Update' : 'Save'}
                </span>
            </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;