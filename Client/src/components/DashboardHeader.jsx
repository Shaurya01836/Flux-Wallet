import React from "react";
import { FaSignOutAlt } from "react-icons/fa";

const DashboardHeader = ({ user, onLogout, onNavigateProfile }) => {
  return (
    <header className="flex justify-between items-center mb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-400 text-sm">
          Hello, {user?.name?.split(" ")[0] || "User"}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onLogout}
          className="p-2 text-gray-300 hover:text-gray-900 transition" 
          title="Log Out"
        >
          <FaSignOutAlt size={18} />
        </button>
        <div
          onClick={onNavigateProfile}
          className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden cursor-pointer hover:ring-2 hover:ring-gray-100 transition"
        >
          {user?.pictureUrl ? (
            <img
              src={user.pictureUrl}
              alt="User"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
              {user?.name?.[0] || "U"}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;