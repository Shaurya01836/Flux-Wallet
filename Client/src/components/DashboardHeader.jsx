import React, { useState } from "react";
import { FaSignOutAlt } from "react-icons/fa";

const DashboardHeader = ({ user, onLogout, onNavigateProfile }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <header className="flex justify-between items-center mb-8 relative z-20">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm flex items-center gap-2">
          Flux.
        </h1>
        <p className="text-indigo-200/80 text-sm font-medium mt-1">
          Welcome back, {user?.name?.split(" ")[0] || "User"}
        </p>
      </div>

      <div className="flex items-center gap-5 bg-white/5 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-[1.5rem] shadow-xl">
        <button
          onClick={onLogout}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          title="Log Out"
        >
          <FaSignOutAlt size={16} />
        </button>
        <div className="w-px h-6 bg-white/10"></div>
        <div
          onClick={onNavigateProfile}
          className="w-10 h-10 rounded-[1rem] bg-indigo-600/20 overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-indigo-400/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-300"
        >
          {user?.pictureUrl && !imgError ? (
            <img
              src={user.pictureUrl}
              alt="User"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-inner">
              {user?.name?.[0] || "U"}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;