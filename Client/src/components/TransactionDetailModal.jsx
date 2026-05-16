import React from "react";
import { FaTimes, FaArrowUp, FaArrowDown, FaCalendarAlt, FaTag, FaAlignLeft, FaMoneyBillWave } from "react-icons/fa";

const TransactionDetailModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  const isCredit = transaction.type === "CREDIT";

  const formattedDate = new Date(transaction.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all animate-scale-up border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-8 text-center bg-gray-50 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
          >
            <FaTimes size={14} />
          </button>

          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-sm ${isCredit ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
            {isCredit ? <FaArrowDown /> : <FaArrowUp />}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">{transaction.title}</h2>
          <p className="text-sm font-bold tracking-widest uppercase text-gray-400">
            {transaction.category || "General"}
          </p>
        </div>

        {/* Body Details */}
        <div className="p-6 space-y-6">

          {/* Amount Large */}
          <div className="text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Amount</p>
            <p className={`text-4xl font-extrabold tracking-tight ${isCredit ? 'text-emerald-500' : 'text-gray-900'}`}>
              {isCredit ? '+' : '-'} Rs.{transaction.amount.toLocaleString()}
            </p>
          </div>

          <div className="h-px bg-gray-100"></div>

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
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{transaction.category || "Uncategorized"}</p>
              </div>
            </div>

            {transaction.description && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                  <FaAlignLeft size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 whitespace-pre-wrap">
                    {transaction.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
