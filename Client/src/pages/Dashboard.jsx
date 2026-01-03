import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaArrowUp,
  FaArrowDown,
  FaBell,
  FaSearch,
  FaTrash,
  FaWallet,
} from "react-icons/fa";
import axios from "axios";
import AddTransactionModal from "../components/AddTransactionModal";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Real Data State
  const [transactions, setTransactions] = useState([]);

  // NEW: Store all 3 values from your BalanceDto
  const [stats, setStats] = useState({
    balance: 0.0,
    income: 0.0,
    expense: 0.0,
  });

  const [user, setUser] = useState(null);

  // 1. Initialize User from Storage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user_info"));
    if (storedUser) {
      setUser(storedUser);
      refreshData(storedUser.id);
    }
  }, []);

  // 2. Function to Fetch Balance & Payments
  const refreshData = async (userId) => {
    try {
      // Fetch BalanceDto (contains balance, totalCredit, totalDebit)
      const balanceRes = await axios.get(
        `http://localhost:8080/api/payments/balance/${userId}`
      );

      setStats({
        balance: balanceRes.data.balance || 0.0,
        income: balanceRes.data.totalCredit || 0.0,
        expense: balanceRes.data.totalDebit || 0.0,
      });

      // Fetch Transactions
      const transactionsRes = await axios.get(
        `http://localhost:8080/api/payments/user/${userId}`
      );
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error("Error loading dashboard data", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`http://localhost:8080/api/payments/${id}`);
      refreshData(user.id);
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full p-4 md:p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Dashboard
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Welcome back, {user?.name?.split(" ")[0] || "User"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button className="bg-white p-3 rounded-full shadow-sm text-gray-400 hover:text-indigo-600 transition">
              <FaSearch />
            </button>
            <button className="bg-white p-3 rounded-full shadow-sm text-gray-400 hover:text-indigo-600 transition">
              <FaBell />
            </button>
            <div
              onClick={() => navigate("/profile")}
              className="w-10 h-10 cursor-pointer bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm overflow-hidden"
            >
              {user?.pictureUrl ? (
                <img
                  src={user.pictureUrl}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              ) : (
                "JD"
              )}
            </div>
          </div>
        </header>

        {/* TOP SECTION: Balance + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 1. Balance Card (Takes 2/3 width) */}
          <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            {/* Decor */}
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <FaWallet className="text-9xl transform -rotate-12 -mr-8 -mt-8" />
            </div>

            <div>
              <p className="text-indigo-100 mb-1 font-medium text-lg">
                Total Balance
              </p>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
                Rs.{stats.balance.toFixed(2)}
              </h1>
            </div>

            <div className="flex gap-4 mt-8 z-10">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition transform active:scale-95 bg-white text-indigo-600 hover:bg-gray-100 shadow-md"
              >
                <FaPlus /> <span>Add Money</span>
              </button>
              <ActionButton icon={<FaArrowUp />} label="Send" />
            </div>
          </div>

          {/* 2. Stats Column (Takes 1/3 width) */}
          <div className="flex flex-col gap-6">
            <StatCard
              label="Total Income"
              value={`Rs.${stats.income.toFixed(2)}`} // Dynamic Income
              icon={<FaArrowDown />}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <StatCard
              label="Total Expense"
              value={`Rs.${stats.expense.toFixed(2)}`} // Dynamic Expense
              icon={<FaArrowUp />}
              color="text-rose-500"
              bg="bg-rose-50"
            />
          </div>
        </div>

        {/* BOTTOM SECTION: Full Width Transactions */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-xl text-gray-800">
              Recent Transactions
            </h3>
            <button className="text-sm text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-lg transition">
              View All
            </button>
          </div>

          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">
                  No transactions found.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-indigo-600 font-bold mt-2 hover:underline"
                >
                  Add your first one
                </button>
              </div>
            ) : (
              transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-2xl transition cursor-pointer group border border-transparent hover:border-gray-100"
                >
                  {/* Left: Icon + Title + Date */}
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-sm ${
                        t.type === "CREDIT"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      {t.type === "CREDIT" ? <FaArrowDown /> : <FaArrowUp />}
                    </div>

                    <div>
                      <p className="font-bold text-gray-900 text-lg">
                        {t.title}
                      </p>
                      <p className="text-sm text-gray-400 font-medium">
                        {formatDate(t.date)}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount + Actions */}
                  <div className="flex items-center gap-6">
                    <span
                      className={`font-bold text-lg tracking-wide ${
                        t.type === "CREDIT"
                          ? "text-emerald-600"
                          : "text-gray-900"
                      }`}
                    >
                      {t.type === "CREDIT" ? "+" : "-"}
                      {t.amount}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(t.id);
                      }}
                      className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionAdded={() => refreshData(user.id)}
      />
    </div>
  );
};

// --- Components ---

const ActionButton = ({ icon, label, light }) => (
  <button
    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition transform active:scale-95 shadow-md ${
      light
        ? "bg-white text-indigo-600 hover:bg-gray-100"
        : "bg-indigo-700 text-white hover:bg-indigo-800"
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const StatCard = ({ label, value, icon, color, bg }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition h-full">
    <div
      className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${bg} ${color}`}
    >
      {icon}
    </div>
    <div>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export default Dashboard;
