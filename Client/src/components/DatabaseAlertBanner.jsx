import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const DatabaseAlertBanner = () => {
  return (
    <div className="w-full bg-[#0B0D19] border-b border-rose-950/40 text-slate-100 px-6 py-4 shadow-lg z-50 relative">
      <div className="max-w-5xl mx-auto flex items-start gap-4">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-2xl shrink-0 shadow-sm">
          <FaExclamationTriangle className="text-lg animate-pulse" />
        </div>
        <div className="flex-grow flex flex-col gap-1">
          <h4 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>Database Compute Limit Exceeded (100 CU-hrs)</span>
            <span className="bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">Offline</span>
          </h4>
          <p className="text-xs font-semibold leading-relaxed text-slate-300">
            The Neon free-tier database compute limits have been reached, suspending database connections. We have deployed pool optimizations (`minimum-idle=0`, short `idle-timeout`) to automatically close idle database connections and let the database scale down, preventing future limit issues.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DatabaseAlertBanner;
