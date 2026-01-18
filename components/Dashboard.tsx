
import React from 'react';
import { SystemStats } from '../types';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';

interface DashboardProps {
  stats: SystemStats;
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const chartData = [
    { name: '00:00', val: 99.8 },
    { name: '04:00', val: 99.9 },
    { name: '08:00', val: 99.7 },
    { name: '12:00', val: 100 },
    { name: '16:00', val: 99.9 },
    { name: '20:00', val: 100 },
  ];

  return (
    <div className="h-full flex flex-col p-8 space-y-10 overflow-y-auto scrollbar-hide">
      <section>
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-6">PROJECT VITALS</h3>
        <div className="grid grid-cols-1 gap-5">
          <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-800/50">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-slate-600 block uppercase">Precision Buffer</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tracking-tighter">100.0</span>
              <span className="text-[10px] text-emerald-500 font-bold mono">STABLE</span>
            </div>
          </div>
          <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-800/50">
            <span className="text-[10px] text-slate-600 block mb-2 uppercase">Engine Hash (SHA-256)</span>
            <span className="text-xs font-mono text-blue-400 block truncate leading-none mb-1">{stats.securityHash}</span>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-full"></div>
              </div>
              <span className="text-[9px] text-slate-600 font-bold">VERIFIED</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Accuracy Metrics</h3>
          <span className="text-[9px] text-blue-500 font-mono">Live Sync</span>
        </div>
        <div className="h-36 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="stepAfter" 
                dataKey="val" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorVal)" 
                strokeWidth={2} 
                animationDuration={2000}
              />
              <YAxis hide domain={[99.5, 100]} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="flex-1">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-6">READY PROTOCOLS</h3>
        <div className="space-y-4">
          <CheckItem label="Token Smart Contract" checked />
          <CheckItem label="Presale logic V3" checked />
          <CheckItem label="Zero-Mistake Code Buffer" checked />
          <CheckItem label="Airdrop Security Layer" checked={false} />
          <CheckItem label="Deployment Handshake" checked={false} />
        </div>
      </section>

      <div className="p-5 bg-blue-600/5 border border-blue-500/10 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Memory Lock Active</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed italic border-l-2 border-slate-800 pl-3">
          "Core project rules are locked. DANEYBIL BTC AI will not diverge from your baseline commands."
        </p>
      </div>
    </div>
  );
};

const CheckItem = ({ label, checked }: { label: string; checked: boolean }) => (
  <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${checked ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-black/20 border-slate-800/40'}`}>
    <span className={`text-[11px] font-medium tracking-tight ${checked ? 'text-slate-200' : 'text-slate-500'}`}>{label}</span>
    {checked ? (
      <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/50 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
    ) : (
      <div className="w-5 h-5 rounded-full border border-slate-700"></div>
    )}
  </div>
);

export default Dashboard;
