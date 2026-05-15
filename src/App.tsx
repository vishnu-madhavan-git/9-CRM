import React, { useState, useEffect } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  Trello, 
  CheckSquare, 
  TrendingUp,
  Search,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Building,
  Calendar,
  Sparkles,
  ChevronRight,
  Filter,
  X,
  Loader2,
  CheckCircle2,
  Circle,
  Bell,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import type { Contact, Task, Note, Deal, Segment, ContactSegment, TeamMember } from './types';

// Components
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Pipeline from './pages/Pipeline';
import Tasks from './pages/Tasks';

type Tab = 'dashboard' | 'contacts' | 'pipeline' | 'tasks';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [contactLinks, setContactLinks] = useState<ContactSegment[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReminders, setActiveReminders] = useState<Task[]>([]);
  const [dismissedReminders, setDismissedReminders] = useState<number[]>([]);

  const fetchData = async () => {
    try {
      const [contactsRes, dealsRes, tasksRes, segmentsRes, linksRes, teamRes] = await Promise.all([
        fetch('/api/contacts'),
        fetch('/api/deals'),
        fetch('/api/tasks'),
        fetch('/api/segments'),
        fetch('/api/contact-segments'),
        fetch('/api/team')
      ]);
      const [contactsData, dealsData, tasksData, segmentsData, linksData, teamData] = await Promise.all([
        contactsRes.json(),
        dealsRes.json(),
        tasksRes.json(),
        segmentsRes.json(),
        linksRes.json(),
        teamRes.json()
      ]);
      setContacts(contactsData);
      setDeals(dealsData);
      setTasks(tasksData);
      setSegments(segmentsData);
      setContactLinks(linksData);
      setTeam(teamData);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const triggered = tasks.filter(task => {
        if (!task.reminder_offset || task.completed || dismissedReminders.includes(task.id)) return false;
        const dueDate = new Date(task.due_date).getTime();
        const triggerDate = dueDate - (task.reminder_offset * 60 * 1000);
        return now >= triggerDate;
      });
      setActiveReminders(triggered);
    }, 5000);
    return () => clearInterval(interval);
  }, [tasks, dismissedReminders]);

  const dismissReminder = (id: number) => {
    setDismissedReminders(prev => [...prev, id]);
    setActiveReminders(prev => prev.filter(r => r.id !== id));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard contacts={contacts} deals={deals} tasks={tasks} onRefresh={fetchData} />;
      case 'contacts': return <Contacts contacts={contacts} segments={segments} contactLinks={contactLinks} onRefresh={fetchData} />;
      case 'pipeline': return <Pipeline deals={deals} contacts={contacts} team={team} onRefresh={fetchData} />;
      case 'tasks': return <Tasks tasks={tasks} contacts={contacts} deals={deals} team={team} onRefresh={fetchData} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-gray-200 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0D0D0D] border-r border-[#262626] flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Nexus CRM</span>
          </div>

          <nav className="space-y-1">
            <SidebarItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
            />
            <SidebarItem 
              icon={<Users size={20} />} 
              label="Contacts" 
              active={activeTab === 'contacts'} 
              onClick={() => setActiveTab('contacts')} 
            />
            <SidebarItem 
              icon={<Trello size={20} />} 
              label="Pipeline" 
              active={activeTab === 'pipeline'} 
              onClick={() => setActiveTab('pipeline')} 
            />
            <SidebarItem 
              icon={<CheckSquare size={20} />} 
              label="Tasks" 
              active={activeTab === 'tasks'} 
              onClick={() => setActiveTab('tasks')} 
            />
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-[#262626]">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors cursor-pointer">
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-[#444] overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Admin`} alt="avatar" />
             </div>
             <div>
                <p className="text-sm font-semibold text-white">Admin User</p>
                <p className="text-xs text-gray-500">Premium Plan</p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#0A0A0A] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-8 max-w-7xl mx-auto"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        {/* Notifications */}
        <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
          <AnimatePresence>
            {activeReminders.map(reminder => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                className="pointer-events-auto bg-[#1A1A1A] border border-indigo-500/50 rounded-2xl p-4 shadow-2xl shadow-indigo-500/20 w-80 flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Bell className="text-indigo-400" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Reminder</p>
                    <button onClick={() => dismissReminder(reminder.id)} className="text-gray-500 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-white mb-1 truncate">{reminder.title}</p>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Clock size={10} />
                    Due at {new Date(reminder.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
        active 
          ? "bg-[#1A1A1A] text-indigo-400" 
          : "text-gray-400 hover:text-white hover:bg-[#1A1A1A]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
