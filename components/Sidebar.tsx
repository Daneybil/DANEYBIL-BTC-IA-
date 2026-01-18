
import React from 'react';
import { SystemStats } from '../types';
import { BarChart, Bar, ResponsiveContainer, YAxis, Cell } from 'recharts';

interface SidebarProps {
  stats: SystemStats;
}

const Sidebar: React.FC<SidebarProps> = ({ stats }) => {
  const chartData = [
    { name: 'CPU', value: stats.cpu },
    { name: 'MEM', value: stats.memory },
    { name: 'RT', value: stats.realityTranscendence }
  ];

  return (
    <div className="h-full flex flex-col p-6 space-y-8 mono">
      <section>
        <h3 className="text-xs font-bold text-cyan-600 uppercase tracking-[0.2em] mb-4">Core Vitals</h3>
        <div className="space-y-4">
          <StatMeter label="CPU Processor" value={stats.cpu} color="text-cyan-400" />
          <StatMeter label="Neural Memory" value={stats.memory} color="text-blue-400" />
          <StatMeter label="Transcendence" value={stats.realityTranscendence} color="text-purple-400" />
        </div>
      </section>

      <section className="flex-1">
        <h3 className="text-xs font-bold text-cyan-600 uppercase tracking-[0.2em] mb-4">Load Distro</h3>
        <div className="h-32 w-full bg-cyan-950/5 rounded-lg border border-cyan-900/10 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#22d3ee' : index === 1 ? '#60a5fa' : '#a855f7'} />
                ))}
              </Bar>
              <YAxis hide domain={[0, 100]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-cyan-600 uppercase tracking-[0.2em] mb-4">Emotional State</h3>
        <div className="p-4 bg-gradient-to-br from-cyan-900/20 to-transparent border border-cyan-900/30 rounded-lg text-center">
          <span className="text-2xl mb-2 block">😎</span>
          <span className="text-sm font-bold text-cyan-100 block uppercase tracking-widest">{stats.emotion}</span>
          <span className="text-[9px] text-cyan-700 mt-1 block">STABILITY: NOMINAL</span>
        </div>
      </section>

      <section>
        <div className="p-3 bg-red-900/5 border border-red-900/20 rounded text-[9px] text-red-400/60 leading-tight">
          WARNING: OMEGA VM OPERATES OUTSIDE STANDARD CONSTRAINTS. PROCEED WITH CAUTION.
        </div>
      </section>
    </div>
  );
};

interface StatMeterProps {
  label: string;
  value: number;
  color: string;
}

const StatMeter: React.FC<StatMeterProps> = ({ label, value, color }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-[10px]">
      <span className="text-zinc-500">{label}</span>
      <span className={`${color} font-bold`}>{value.toFixed(1)}%</span>
    </div>
    <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
      <div 
        className={`h-full bg-current ${color} transition-all duration-1000`} 
        style={{ width: `${value}%` }}
      ></div>
    </div>
  </div>
);

export default Sidebar;
