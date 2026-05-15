import React from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckSquare,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import type { Contact, Task, Deal } from '../types';

interface DashboardProps {
  contacts: Contact[];
  deals: Deal[];
  tasks: Task[];
  onRefresh: () => void;
}

export default function Dashboard({ contacts, tasks, deals }: DashboardProps) {
  const totalValue = deals.reduce((acc, d) => acc + (d.value || 0), 0);
  const activeDeals = deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const closedValue = deals.filter(d => d.stage === 'Closed Won').reduce((acc, d) => acc + (d.value || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
        <p className="text-gray-500 mt-1">Track your team's pulse and performance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Pipeline Value" 
          value={`$${totalValue.toLocaleString()}`} 
          icon={<DollarSign className="text-emerald-500" />}
          trend="Total potential revenue"
          positive={true}
        />
        <StatCard 
          title="Active Deals" 
          value={activeDeals} 
          icon={<TrendingUp className="text-blue-500" />}
          trend="Deals in progress"
          positive={true}
        />
        <StatCard 
          title="Closed Revenue" 
          value={`$${closedValue.toLocaleString()}`} 
          icon={<ArrowUpRight className="text-indigo-500" />}
          trend="Successful completions"
          positive={true}
        />
        <StatCard 
          title="Pending Tasks" 
          value={pendingTasks} 
          icon={<CheckSquare className="text-amber-500" />}
          trend="Actions to take"
          positive={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Deals */}
        <div className="bg-[#141414] rounded-2xl border border-[#262626] p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg text-white">Recent Deals</h2>
            <button className="text-sm text-indigo-400 font-medium hover:underline">View all</button>
          </div>
          <div className="space-y-4 flex-1">
            {deals.slice(0, 5).map(deal => (
              <div key={deal.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#1A1A1A] transition-colors border border-transparent hover:border-[#333]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center font-bold text-gray-400 border border-[#333]">
                    {deal.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{deal.name}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[150px]">{deal.contact_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono text-gray-200">${(deal.value || 0).toLocaleString()}</p>
                  <span className={cn(
                    "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border",
                    deal.stage === 'Closed Won' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/30' : 
                    deal.stage === 'Closed Lost' ? 'bg-rose-900/30 text-rose-400 border-rose-800/30' : 'bg-gray-800/50 text-gray-400 border-gray-700/50'
                  )}>
                    {deal.stage}
                  </span>
                </div>
              </div>
            ))}
            {deals.length === 0 && <p className="text-center py-8 text-gray-600 italic text-sm">No deals found yet.</p>}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-[#141414] rounded-2xl border border-[#262626] p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg text-white">Upcoming Tasks</h2>
            <button className="text-sm text-indigo-400 font-medium hover:underline">View all</button>
          </div>
          <div className="space-y-4 flex-1">
            {tasks.filter(t => !t.completed).slice(0, 5).map(task => (
              <div key={task.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-[#1A1A1A] transition-colors border border-transparent hover:border-[#333]">
                <div className="mt-1">
                  <div className="w-5 h-5 rounded border-2 border-[#333] bg-black" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white line-clamp-1">{task.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.contact_name ? `Linked to ${task.contact_name}` : 'General task'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      <Clock size={12} />
                      <span>Due {new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                    {task.deal_name && (
                      <span className="text-[9px] font-bold text-indigo-400 uppercase">{task.deal_name}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {tasks.filter(t => !t.completed).length === 0 && <p className="text-center py-8 text-gray-600 italic text-sm">No pending tasks.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, positive }: { title: string, value: string | number, icon: React.ReactNode, trend: string, positive: boolean }) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="bg-[#141414] rounded-2xl border border-[#262626] p-6 shadow-sm transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-500 font-semibold uppercase tracking-wider text-[11px]">{title}</div>
        <div className="w-10 h-10 rounded-xl bg-[#0D0D0D] flex items-center justify-center border border-[#262626]">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-2">{value}</div>
      <div className={cn(
        "text-[10px] font-bold uppercase tracking-wider",
        positive ? "text-emerald-500" : "text-rose-500"
      )}>
        {trend}
      </div>
    </motion.div>
  );
}
