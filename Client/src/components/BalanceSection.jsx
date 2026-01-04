import React from "react";
import { FaPlus } from "react-icons/fa";

const BalanceSection = ({ balance, onAdd }) => {
  return (
    <div className="md:col-span-1 flex flex-col justify-center">
      <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Balance</p>
      <h2 className="text-5xl font-extrabold text-gray-900 tracking-tight">
        Rs.{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </h2>
      <div className="mt-8 flex gap-4">
        <button 
          onClick={onAdd}
          className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-black transition flex items-center gap-2"
        >
          <FaPlus size={12} /> Add New
        </button>
      </div>
    </div>
  );
};

export default BalanceSection;