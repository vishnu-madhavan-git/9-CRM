import React, { useState } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar,
  X,
  Search,
  Filter,
  User,
  CheckSquare,
  Briefcase,
  Bell,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Task, Contact, Deal, TeamMember } from '../types';
import { cn } from '../lib/utils';
import MentionTextarea from '../components/MentionTextarea';
import MentionText from '../components/MentionText';

interface TasksProps {
  tasks: Task[];
  contacts: Contact[];
  deals: Deal[];
  team: TeamMember[];
  onRefresh: () => void;
}

const priorityMap: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1
};

export default function Tasks({ tasks, contacts, deals, team, onRefresh }: TasksProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [contactFilter, setContactFilter] = useState<string>('all');
  const [dealFilter, setDealFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'status'>('due_date');

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'due_date') {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (sortBy === 'priority') {
      return (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
    }
    if (sortBy === 'status') {
      return (a.completed === b.completed) ? 0 : a.completed ? 1 : -1;
    }
    return 0;
  });

  const filteredTasks = sortedTasks.filter(t => {
    // Status Filter
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'pending' && !t.completed) || 
      (statusFilter === 'completed' && t.completed);
    
    // Contact Filter
    const contactMatch = contactFilter === 'all' || t.contact_id?.toString() === contactFilter;

    // Deal Filter
    const dealMatch = dealFilter === 'all' || t.deal_id?.toString() === dealFilter;

    // Priority Filter
    const priorityMatch = priorityFilter === 'all' || t.priority === priorityFilter;

    return statusMatch && contactMatch && dealMatch && priorityMatch;
  });

  const toggleTask = async (id: number, completed: boolean) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Today's Tasks</h1>
          <p className="text-gray-500 mt-1">Organize your outreach and action items.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          New Task
        </button>
      </div>

      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 p-1 bg-[#0A0A0A] rounded-xl w-fit border border-[#262626]">
            <FilterTab active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')} label="Pending" count={tasks.filter(t => !t.completed).length} />
            <FilterTab active={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')} label="Completed" />
            <FilterTab active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} label="All" />
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
            <Filter size={14} />
            Advanced Filters
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Contact</label>
            <select 
              className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl px-3 py-2 text-xs text-gray-300 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              value={contactFilter}
              onChange={(e) => setContactFilter(e.target.value)}
            >
              <option value="all">Every Contact</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Deal</label>
            <select 
              className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl px-3 py-2 text-xs text-gray-300 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              value={dealFilter}
              onChange={(e) => setDealFilter(e.target.value)}
            >
              <option value="all">Every Deal</option>
              {deals.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Priority</label>
            <select 
              className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl px-3 py-2 text-xs text-gray-300 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">Every Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Sort By</label>
            <div className="relative group/sort">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/sort:text-indigo-500 transition-colors" size={14} />
              <select 
                className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl pl-9 pr-3 py-2 text-xs text-gray-300 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks.map(task => (
          <motion.div 
            key={task.id}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="group flex items-start gap-4 p-4 bg-[#141414] border border-[#262626] rounded-2xl hover:border-indigo-500 transition-all"
          >
            <button 
              onClick={() => toggleTask(task.id, task.completed)}
              className={cn(
                "mt-0.5 shrink-0 transition-colors",
                task.completed ? "text-indigo-500" : "text-gray-600 group-hover:text-indigo-400"
              )}
            >
              {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <p className={cn(
                  "font-bold text-white transition-all",
                  task.completed && "line-through text-gray-500"
                )}>
                  {task.title}
                </p>
                <div className={cn(
                  "text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest",
                  getPriorityColor(task.priority)
                )}>
                  {task.priority || 'medium'}
                </div>
              </div>
                <MentionText text={task.description} className="text-sm text-gray-500 mt-1" />
              
              <div className="flex flex-wrap items-center gap-4 mt-3">
                 {task.contact_name && (
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <User size={12} />
                      {task.contact_name}
                   </div>
                 )}
                 {task.deal_name && (
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <Briefcase size={12} />
                      {task.deal_name}
                   </div>
                 )}
                 <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    <Calendar size={12} />
                    {new Date(task.due_date).toLocaleDateString()}
                 </div>
                 {task.reminder_offset && (
                   <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                      <Bell size={12} />
                      Reminder Set
                   </div>
                 )}
              </div>
            </div>
          </motion.div>
        ))}
        {filteredTasks.length === 0 && (
          <div className="text-center py-16 bg-[#141414] border border-[#262626] border-dashed rounded-3xl">
             <div className="bg-[#0A0A0A] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#262626]">
                <CheckSquare className="text-[#333]" size={32} />
             </div>
             <p className="text-gray-500 font-medium italic">No tasks match your current filters.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <TaskModal 
          contacts={contacts} 
          deals={deals} 
          team={team}
          onClose={() => setIsModalOpen(false)} 
          onRefresh={onRefresh} 
        />
      )}
    </div>
  );
}

function FilterTab({ active, onClick, label, count }: { active: boolean, onClick: () => void, label: string, count?: number }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
        active ? "bg-[#1A1A1A] text-white" : "text-gray-500 hover:text-white"
      )}
    >
      {label}
      {count !== undefined && <span className="bg-indigo-600/20 text-indigo-400 px-1.5 py-0.5 rounded-md text-[10px]">{count}</span>}
    </button>
  );
}

function TaskModal({ contacts, deals, team, onClose, onRefresh }: { contacts: Contact[], deals: Deal[], team: TeamMember[], onClose: () => void, onRefresh: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    contact_id: '',
    deal_id: '',
    priority: 'medium',
    reminder_offset: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          contact_id: formData.contact_id ? Number(formData.contact_id) : null,
          deal_id: formData.deal_id ? Number(formData.deal_id) : null,
          priority: formData.priority,
          reminder_offset: formData.reminder_offset ? Number(formData.reminder_offset) : null
        })
      });
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0D0D0D] border border-[#262626] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-[#0A0A0A]">
          <h2 className="text-lg font-bold text-white">New Task</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#1A1A1A] text-gray-400 hover:text-white rounded-lg transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Title</label>
            <input 
              required
              placeholder="e.g. Follow up on proposal"
              className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Description</label>
            <MentionTextarea 
              team={team}
              placeholder="Add details about the task..."
              value={formData.description}
              onChange={val => setFormData({...formData, description: val})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Due Date & Time</label>
            <input 
              type="datetime-local"
              required
              className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold" 
              value={formData.due_date}
              onChange={e => setFormData({...formData, due_date: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Related Contact</label>
            <select 
              className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
              value={formData.contact_id}
              onChange={e => setFormData({...formData, contact_id: e.target.value})}
            >
              <option value="">None</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Related Deal</label>
            <select 
              className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
              value={formData.deal_id}
              onChange={e => setFormData({...formData, deal_id: e.target.value})}
            >
              <option value="">None</option>
              {deals.map(d => (
                <option key={d.id} value={d.id}>{d.name} (${d.value.toLocaleString()})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Priority</label>
            <select 
              className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
              value={formData.priority}
              onChange={e => setFormData({...formData, priority: e.target.value as any})}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Reminder</label>
            <select 
              className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
              value={formData.reminder_offset}
              onChange={e => setFormData({...formData, reminder_offset: e.target.value})}
            >
              <option value="">No Reminder</option>
              <option value="60">1 Hour Before</option>
              <option value="1440">1 Day Before</option>
              <option value="10080">1 Week Before</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4 border-t border-[#262626]">
             <button type="button" onClick={onClose} className="flex-1 py-3 px-4 bg-transparent border border-[#333] rounded-xl font-bold text-gray-400 hover:text-white hover:bg-[#1A1A1A] transition-all">Cancel</button>
             <button type="submit" className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all">Create Task</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
