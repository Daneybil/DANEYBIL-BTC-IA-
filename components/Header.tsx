
import React, { useState, useEffect } from 'react';
import { SystemStats } from '../types';

interface HeaderProps {
  isLiveActive: boolean;
  onToggleLive: () => void;
  stats: SystemStats;
}

const Header: React.FC<HeaderProps> = ({ isLiveActive, onToggleLive, stats }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-black/40 border-b border-slate-800/60 backdrop-blur-xl z-50">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 rotate-3 transition-transform hover:rotate-0">
             <span className="font-black text-white text-xl">D</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#020617] rounded-full"></div>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            DANEYBIL <span className="text-blue-500">BTC AI</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-medium tracking-[0.2em] uppercase">Advanced Blockchain Command Center</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-8 text-[11px] mono text-slate-400">
          <div className="flex flex-col">
            <span className="text-slate-600">ENGINE</span>
            <span className="text-emerald-400">{stats.engineStatus}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-600">PRECISION</span>
            <span className="text-white">{stats.precisionLevel}%</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-600">TIME_UTC</span>
            <span className="text-white">{time.toLocaleTimeString([], { hour12: false })}</span>
          </div>
        </div>

        <button 
          onClick={onToggleLive}
          className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-xs transition-all ${
            isLiveActive 
            ? 'bg-red-500/10 text-red-500 border border-red-500/50' 
            : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
          }`}
        >
          {isLiveActive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              END CALL
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              LIVE CALL
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
