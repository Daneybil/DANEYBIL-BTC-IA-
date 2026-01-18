
import React from 'react';
import { SystemStats, ChatSession } from '../types';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface DashboardProps {
  stats: SystemStats;
  sessions: ChatSession[];
  activeSessionId: string;
  onLoadSession: (id: string) => void;
  onCreateSession: () => void;
  onUpdateStats: (newStats: Partial<SystemStats>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  stats, 
  sessions, 
  activeSessionId, 
  onLoadSession, 
  onCreateSession,
  onUpdateStats 
}) => {
  const chartData = [
    { name: '00:00', val: 99.8 },
    { name: '04:00', val: 99.9 },
    { name: '08:00', val: 99.7 },
    { name: '12:00', val: 100 },
    { name: '16:00', val: 99.9 },
    { name: '20:00', val: 100 },
  ];

  return (
    <div className="h-full flex flex-col p-8 space-y-8 overflow-y-auto scrollbar-hide bg-transparent">
      
      {/* SYSTEM CONTROLS - NEW */}
      <section>
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">SYSTEM CONTROLS</h3>
        <div className="space-y-3">
          <ControlToggle 
            label="Voice Response" 
            active={stats.audioOutputEnabled} 
            onToggle={() => onUpdateStats({ audioOutputEnabled: !stats.audioOutputEnabled })} 
          />
          <ControlToggle 
            label="Auto-Copy Code" 
            active={stats.autoCopyEnabled} 
            onToggle={() => onUpdateStats({ autoCopyEnabled: !stats.autoCopyEnabled })} 
          />
        </div>
      </section>

      {/* COMMAND HISTORY - NEW */}
      <section className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">COMMAND HISTORY</h3>
          <button 
            onClick={onCreateSession}
            className="p-1 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
            title="New Session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
        <div className="space-y-2 overflow-y-auto scrollbar-hide pr-1">
          {sessions.length === 0 ? (
            <p className="text-[10px] text-slate-600 italic">No historical logs found.</p>
          ) : (
            sessions.map(session => (
              <button
                key={session.id}
                onClick={() => onLoadSession(session.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all truncate text-[11px] font-medium ${
                  activeSessionId === session.id 
                  ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' 
                  : 'bg-black/20 border-white/5 text-slate-500 hover:border-white/10'
                }`}
              >
                {session.title}
              </button>
            ))
          )}
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-6">PROJECT VITALS</h3>
        <div className="grid grid-cols-1 gap-5">
          <div className="bg-white/5 p-5 rounded-xl border border-white/5 backdrop-blur-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Zero-Mistake Buffer</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tracking-tighter">100.0</span>
              <span className="text-[10px] text-emerald-500 font-bold mono">GOD_MODE</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="h-24 w-full relative">
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
              />
              <YAxis hide domain={[99.5, 100]} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="p-5 bg-blue-600/5 border border-blue-500/10 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Memory Lock Active</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed italic border-l-2 border-white/5 pl-3">
          "Core project rules are locked. History persistence active."
        </p>
      </div>
    </div>
  );
};

const ControlToggle = ({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) => (
  <button 
    onClick={onToggle}
    className="w-full flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-all group"
  >
    <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors">{label}</span>
    <div className={`w-8 h-4 rounded-full relative transition-colors ${active ? 'bg-blue-600' : 'bg-slate-800'}`}>
      <div className={`absolute top-0.5 bottom-0.5 w-3 rounded-full bg-white transition-all ${active ? 'left-4.5' : 'left-0.5'}`}></div>
    </div>
  </button>
);

export default Dashboard;
