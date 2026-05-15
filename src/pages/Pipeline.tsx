import React, { useState, useEffect } from 'react';
import { 
  Building, 
  ChevronRight, 
  MapPin, 
  Clock,
  MoreVertical,
  Plus,
  X,
  User,
  Calendar,
  MessageSquare,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Deal, Contact, Note, TeamMember } from '../types';
import { cn } from '../lib/utils';
import MentionTextarea from '../components/MentionTextarea';
import MentionText from '../components/MentionText';

interface PipelineProps {
  deals: Deal[];
  contacts: Contact[];
  team: TeamMember[];
  onRefresh: () => void;
}

const STAGES = [
  'Prospecting',
  'Qualification',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost'
];

export default function Pipeline({ deals, contacts, team, onRefresh }: PipelineProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const moveDeal = async (id: number, newStage: string) => {
    try {
      await fetch(`/api/deals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 h-full flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Sales Pipeline</h1>
          <p className="text-gray-500 mt-1">Manage deals and track revenue potential.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#141414] rounded-xl border border-[#262626] text-sm font-bold shadow-sm">
             <span className="text-gray-500 uppercase tracking-widest text-[9px]">Pipeline Value:</span>
             <span className="text-emerald-400 text-lg font-mono">$
               {deals.reduce((acc, d) => acc + (d.value || 0), 0).toLocaleString()}
             </span>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            New Deal
          </button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 min-h-[600px] flex-1 no-scrollbar">
        {STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage);
          const stageValue = stageDeals.reduce((acc, d) => acc + (d.value || 0), 0);
          
          return (
            <div 
              key={stage} 
              className="w-80 shrink-0 flex flex-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e: React.DragEvent) => {
                const dealId = Number(e.dataTransfer.getData('dealId'));
                moveDeal(dealId, stage);
              }}
            >
              <div className="flex items-center justify-between mb-4 group px-1">
                <div className="flex items-center gap-2">
                   <h3 className="font-bold text-gray-400 group-hover:text-white transition-colors uppercase tracking-wider text-[11px]">{stage}</h3>
                   <span className="bg-[#1A1A1A] text-gray-200 text-[10px] font-black px-2 py-0.5 rounded-full border border-[#333]">{stageDeals.length}</span>
                </div>
                <div className="text-[10px] font-bold text-gray-500 font-mono">${stageValue.toLocaleString()}</div>
              </div>

              <div className={cn(
                "flex-1 bg-[#141414]/40 rounded-2xl p-3 border-2 border-dashed border-transparent transition-all space-y-4 overflow-y-auto custom-scrollbar",
                "group-hover:border-[#262626] group-hover:bg-[#141414]/60"
              )}>
                {stageDeals.map(deal => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e: React.DragEvent) => e.dataTransfer.setData('dealId', deal.id.toString())}
                    onClick={() => setSelectedDeal(deal)}
                    className="bg-[#1A1A1A] p-4 rounded-xl border border-[#262626] shadow-sm hover:border-indigo-500 hover:shadow-indigo-500/10 cursor-pointer active:scale-[0.98] transition-all group/card"
                  >
                    <p className="text-sm font-bold text-white group-hover/card:text-indigo-400 transition-colors">{deal.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1 mb-3">
                       <User size={10} />
                       <span className="truncate">{deal.contact_name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
                       <span className="text-sm font-bold text-gray-300 font-mono">${(deal.value || 0).toLocaleString()}</span>
                       <div className="flex items-center gap-1 text-[9px] text-gray-500 font-bold uppercase transition-all">
                          <Calendar size={10} />
                          {deal.close_date ? new Date(deal.close_date).toLocaleDateString() : 'N/A'}
                       </div>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3 border-2 border-dashed border-[#262626] rounded-xl text-gray-500 hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                   <Plus size={14} /> Add deal
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedDeal && (
          <DealDetails deal={selectedDeal} team={team} onClose={() => setSelectedDeal(null)} onRefresh={onRefresh} />
        )}
      </AnimatePresence>

      {isModalOpen && (
        <DealModal contacts={contacts} onClose={() => setIsModalOpen(false)} onRefresh={onRefresh} />
      )}
    </div>
  );
}

function DealDetails({ deal, team, onClose, onRefresh }: { deal: Deal, team: TeamMember[], onClose: () => void, onRefresh: () => void }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteContent, setNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [deal.id]);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/deals/${deal.id}/notes`);
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${deal.name}"?`)) return;
    try {
      await fetch(`/api/deals/${deal.id}`, { method: 'DELETE' });
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await fetch(`/api/deals/${deal.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent })
      });
      setNoteContent('');
      fetchNotes();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="absolute top-0 right-0 h-full w-[450px] bg-[#0A0A0A] border-l border-[#262626] shadow-2xl z-50 flex flex-col"
    >
      <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-[#0D0D0D]">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-[#1A1A1A] text-gray-400 hover:text-white rounded-lg transition-colors">
            <ChevronRight size={20} />
          </button>
          <h2 className="text-lg font-bold text-white">Deal Details</h2>
        </div>
        <button 
          onClick={handleDelete}
          className="text-rose-400 hover:text-rose-300 text-xs font-bold uppercase tracking-widest"
        >
          Delete
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">{deal.name}</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <User size={16} />
                {deal.contact_name}
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-400 font-mono">
                ${deal.value.toLocaleString()}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                {deal.stage}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <MessageSquare size={14} /> Activity Notes
               </h4>
               <span className="text-[10px] font-bold text-gray-600">{notes.length} total</span>
            </div>

            <form onSubmit={addNote} className="relative">
              <MentionTextarea 
                team={team}
                placeholder="Share an update or add a follow-up note..."
                value={noteContent}
                onChange={val => setNoteContent(val)}
              />
              <button 
                type="submit"
                disabled={isSubmitting || !noteContent.trim()}
                className="absolute bottom-4 right-4 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all"
              >
                <Send size={16} />
              </button>
            </form>

            <div className="space-y-4 pt-4">
              {notes.map(note => (
                <div key={note.id} className="p-4 bg-[#141414] border border-[#262626] rounded-2xl group">
                  <MentionText text={note.content} className="text-sm text-gray-300 leading-relaxed" />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                      {new Date(note.created_at).toLocaleDateString()} at {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-[#262626] rounded-3xl">
                   <MessageSquare className="mx-auto text-[#262626] mb-4" size={32} />
                   <p className="text-gray-500 text-xs italic">No activity recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DealModal({ contacts, onClose, onRefresh }: { contacts: Contact[], onClose: () => void, onRefresh: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    contact_id: '',
    value: 0,
    stage: 'Prospecting',
    close_date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          contact_id: Number(formData.contact_id),
          value: Number(formData.value)
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
      <div className="bg-[#0D0D0D] border border-[#262626] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-[#0A0A0A]">
          <h2 className="text-lg font-bold text-white">New Deal</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#1A1A1A] text-gray-400 hover:text-white rounded-lg transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Deal Name</label>
            <input 
              required
              className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Related Contact</label>
            <select 
              required
              className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
              value={formData.contact_id}
              onChange={e => setFormData({...formData, contact_id: e.target.value})}
            >
              <option value="">Select Contact</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Value ($)</label>
                <input 
                  type="number"
                  className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold" 
                  value={formData.value}
                  onChange={e => setFormData({...formData, value: Number(e.target.value)})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Close Date</label>
                <input 
                  type="date"
                  className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold" 
                  value={formData.close_date}
                  onChange={e => setFormData({...formData, close_date: e.target.value})}
                />
             </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Stage</label>
            <select 
              className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
              value={formData.stage}
              onChange={e => setFormData({...formData, stage: e.target.value})}
            >
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex gap-4 pt-4 border-t border-[#262626]">
             <button type="button" onClick={onClose} className="flex-1 py-3 px-4 bg-transparent border border-[#333] rounded-xl font-bold text-gray-400 hover:text-white hover:bg-[#1A1A1A] transition-all">Cancel</button>
             <button type="submit" className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all">Create Deal</button>
          </div>
        </form>
      </div>
    </div>
  );
}
