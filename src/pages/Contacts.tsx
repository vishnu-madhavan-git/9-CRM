import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  Mail,
  Phone,
  Building,
  MoreVertical,
  X,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import type { Contact, Segment, ContactSegment } from '../types';
import { cn } from '../lib/utils';

interface ContactsProps {
  contacts: Contact[];
  segments: Segment[];
  contactLinks: ContactSegment[];
  onRefresh: () => void;
}

export default function Contacts({ contacts, segments, contactLinks, onRefresh }: ContactsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [valueFilter, setValueFilter] = useState<string>('all');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const filteredContacts = contacts.filter(c => {
    const searchMatch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const statusMatch = statusFilter === 'all' || c.status === statusFilter;
    
    let segmentMatch = true;
    if (segmentFilter !== 'all') {
      segmentMatch = contactLinks.some(l => l.contact_id === c.id && l.segment_id === Number(segmentFilter));
    }
    
    let valueMatch = true;
    if (valueFilter === 'under1k') valueMatch = c.value < 1000;
    else if (valueFilter === '1k-10k') valueMatch = c.value >= 1000 && c.value <= 10000;
    else if (valueFilter === '10k-50k') valueMatch = c.value > 10000 && c.value <= 50000;
    else if (valueFilter === 'over50k') valueMatch = c.value > 50000;

    return searchMatch && statusMatch && valueMatch && segmentMatch;
  });

  const fetchInsights = async (id: number) => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: id })
      });
      const data = await res.json();
      setAiInsights(data.insights);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Contacts</h1>
          <p className="text-gray-500 mt-1">Manage your relationships and lead database.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Add Contact
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="relative group col-span-1 md:col-span-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 mb-1.5 block">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search leads, deals, or companies..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-xl text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 block">Status</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-xl text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
          >
            <option value="all">Every Status</option>
            <option value="lead">Lead</option>
            <option value="contacted">Contacted</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="closed">Closed</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 block">Deal Value</label>
          <select 
            value={valueFilter}
            onChange={(e) => setValueFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-xl text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
          >
            <option value="all">Any Value</option>
            <option value="under1k">Under $1k</option>
            <option value="1k-10k">$1k - $10k</option>
            <option value="10k-50k">$10k - $50k</option>
            <option value="over50k">Over $50k</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between pl-1">
             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Segment</label>
             <button onClick={() => setIsSegmentModalOpen(true)} className="text-[9px] font-bold text-indigo-400 hover:underline">Edit Lists</button>
          </div>
          <select 
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-xl text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
          >
            <option value="all">All Groups</option>
            {segments.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-[#141414] rounded-2xl border border-[#262626] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0D0D0D] border-b border-[#262626]">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Groups</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {filteredContacts.map(contact => (
                <tr 
                  key={contact.id} 
                  className="hover:bg-[#1A1A1A] transition-colors cursor-pointer group"
                  onClick={() => {
                    setSelectedContact(contact);
                    fetchInsights(contact.id);
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] text-indigo-400 flex items-center justify-center font-bold border border-[#333] group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all">
                        {contact.name.charAt(0)}
                      </div>
                      <span className="font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight line-clamp-1">{contact.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {contactLinks
                        .filter(l => l.contact_id === contact.id)
                        .map(link => {
                          const segment = segments.find(s => s.id === link.segment_id);
                          if (!segment) return null;
                          return (
                            <span 
                              key={segment.id}
                              className={cn(
                                "text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider border",
                                segment.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                segment.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                segment.color === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                segment.color === 'rose' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                'bg-gray-500/10 text-gray-400 border-gray-500/20'
                              )}
                            >
                              {segment.name}
                            </span>
                          );
                        })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-300">{contact.company}</span>
                      <span className="text-xs text-gray-500">{contact.jobTitle}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Mail size={12} className="text-gray-500" />
                        {contact.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Phone size={12} className="text-gray-500" />
                        {contact.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={contact.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold font-mono text-gray-200">${contact.value.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           setContactToEdit(contact);
                           setIsModalOpen(true);
                         }}
                         className="p-1 px-2 text-xs font-bold text-gray-500 hover:text-indigo-400 border border-transparent hover:border-[#333] rounded transition-all"
                       >
                         Edit
                       </button>
                       <button 
                         onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`Delete ${contact.name}?`)) {
                               await fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' });
                               onRefresh();
                            }
                         }}
                         className="p-1 px-2 text-xs font-bold text-gray-500 hover:text-rose-400 border border-transparent hover:border-[#333] rounded transition-all"
                       >
                         Delete
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-600 italic text-sm">
                    No contacts matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over details */}
      <AnimatePresence>
        {selectedContact && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedContact(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full max-w-lg bg-[#0D0D0D] shadow-2xl z-50 overflow-auto flex flex-col border-l border-[#262626]"
            >
              <div className="p-6 border-b border-[#262626] flex items-center justify-between sticky top-0 bg-[#0D0D0D]/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                      {selectedContact.name.charAt(0)}
                   </div>
                   <div>
                      <h2 className="text-lg font-bold text-white">{selectedContact.name}</h2>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{selectedContact.company}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedContact(null)}
                  className="p-2 hover:bg-[#1A1A1A] text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-8 flex-1">
                 <div className="grid grid-cols-2 gap-4">
                    <InfoBox label="Email" value={selectedContact.email} icon={<Mail size={14}/>} />
                    <InfoBox label="Phone" value={selectedContact.phone} icon={<Phone size={14}/>} />
                    <InfoBox label="Company" value={selectedContact.company} icon={<Building size={14}/>} />
                    <InfoBox label="Value" value={`$${selectedContact.value.toLocaleString()}`} icon={<div className="text-[10px] font-bold">$</div>} />
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Segments & Groups</h3>
                    <div className="flex flex-wrap gap-2">
                       {segments.map(segment => {
                          const isLinked = contactLinks.some(l => l.contact_id === selectedContact.id && l.segment_id === segment.id);
                          return (
                            <button
                              key={segment.id}
                              onClick={async () => {
                                if (isLinked) {
                                  await fetch(`/api/contact-segments/${selectedContact.id}/${segment.id}`, { method: 'DELETE' });
                                } else {
                                  await fetch('/api/contact-segments', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ contact_id: selectedContact.id, segment_id: segment.id })
                                  });
                                }
                                onRefresh();
                              }}
                              className={cn(
                                "text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all",
                                isLinked 
                                  ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20" 
                                  : "bg-[#1A1A1A] text-gray-400 border-[#333] hover:border-gray-500 hover:text-white"
                              )}
                            >
                              {segment.name}
                            </button>
                          );
                       })}
                    </div>
                 </div>

                 {/* AI Insights Section */}
                 <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-2xl p-6 overflow-hidden relative">
                    <div className="flex items-center gap-2 mb-4">
                       <Sparkles className="text-indigo-400 w-5 h-5 animate-pulse" />
                       <h3 className="font-bold text-indigo-300 uppercase tracking-wider text-[11px]">AI-Powered Insights</h3>
                    </div>
                    
                    {isAiLoading ? (
                      <div className="flex items-center gap-3 text-indigo-400/60 py-8">
                         <Loader2 className="animate-spin" size={18} />
                         <span className="text-sm font-medium">Analyzing relationship history...</span>
                      </div>
                    ) : aiInsights ? (
                      <div className="prose prose-sm prose-invert max-w-none text-gray-300">
                         <ReactMarkdown>{aiInsights}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm text-indigo-400/50 italic">No notes or history available for AI analysis.</p>
                    )}

                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add/Edit Contact Modal */}
      {isModalOpen && (
        <ContactModal 
          onClose={() => {
            setIsModalOpen(false);
            setContactToEdit(null);
          }} 
          onRefresh={onRefresh} 
          contactToEdit={contactToEdit || undefined} 
        />
      )}

      {isSegmentModalOpen && (
        <SegmentManager 
          segments={segments} 
          onClose={() => setIsSegmentModalOpen(false)} 
          onRefresh={onRefresh} 
        />
      )}
    </div>
  );
}

function SegmentManager({ segments, onClose, onRefresh }: { segments: Segment[], onClose: () => void, onRefresh: () => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('indigo');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/segments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });
    setName('');
    onRefresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this segment? Contacts will be unassigned but not deleted.')) return;
    await fetch(`/api/segments/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-[#0D0D0D] border border-[#262626] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-[#0A0A0A]">
          <h2 className="text-lg font-bold text-white">Manage Segments</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#1A1A1A] text-gray-400 hover:text-white rounded-lg transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          <form onSubmit={handleAdd} className="space-y-4 p-4 bg-[#141414] rounded-2xl border border-[#262626]">
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Create New Group</p>
             <div className="flex gap-2">
                <input 
                  required
                  placeholder="Group name..."
                  className="flex-1 px-3 py-1.5 bg-[#0A0A0A] border border-[#333] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <select 
                  className="bg-[#0A0A0A] border border-[#333] rounded-xl text-xs px-2"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                >
                  <option value="indigo">Blue</option>
                  <option value="emerald">Green</option>
                  <option value="amber">Yellow</option>
                  <option value="rose">Red</option>
                </select>
                <button type="submit" className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"><Plus size={18}/></button>
             </div>
          </form>

          <div className="space-y-2">
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Active Groups</p>
             {segments.map(segment => (
               <div key={segment.id} className="flex items-center justify-between p-3 bg-[#1A1A1A] border border-[#262626] rounded-xl group/seg">
                  <div className="flex items-center gap-3">
                     <div className={cn(
                       "w-2 h-2 rounded-full",
                       segment.color === 'indigo' ? 'bg-indigo-500' :
                       segment.color === 'emerald' ? 'bg-emerald-500' :
                       segment.color === 'amber' ? 'bg-amber-500' :
                       segment.color === 'rose' ? 'bg-rose-500' : 'bg-gray-500'
                     )} />
                     <span className="text-sm font-bold text-gray-200">{segment.name}</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(segment.id)}
                    className="p-1 px-2 text-[10px] font-bold text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                  >
                    Remove
                  </button>
               </div>
             ))}
             {segments.length === 0 && <p className="text-center py-8 text-gray-600 italic text-xs">No groups created yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    lead: 'bg-gray-800/50 text-gray-400 border-gray-700/50',
    contacted: 'bg-blue-900/30 text-blue-400 border-blue-800/30',
    proposal: 'bg-indigo-900/30 text-indigo-400 border-indigo-800/30',
    negotiation: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/30',
    closed: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/30',
    lost: 'bg-rose-900/30 text-rose-400 border-rose-800/30'
  };
  return (
    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${styles[status] || styles.lead}`}>
      {status}
    </span>
  );
}

function InfoBox({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="p-3 bg-[#1A1A1A] border border-[#262626] rounded-xl">
      <div className="flex items-center gap-1.5 text-gray-500 mb-1">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-sm font-bold text-white truncate">{value || 'N/A'}</div>
    </div>
  );
}

function ContactModal({ onClose, onRefresh, contactToEdit }: { onClose: () => void, onRefresh: () => void, contactToEdit?: Contact }) {
  const [formData, setFormData] = useState({
    first_name: contactToEdit?.first_name || '',
    last_name: contactToEdit?.last_name || '',
    company: contactToEdit?.company || '',
    email: contactToEdit?.email || '',
    phone: contactToEdit?.phone || '',
    jobTitle: contactToEdit?.jobTitle || '',
    value: contactToEdit?.value || 0,
    status: contactToEdit?.status || 'lead'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = contactToEdit ? `/api/contacts/${contactToEdit.id}` : '/api/contacts';
      const method = contactToEdit ? 'PATCH' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
        className="bg-[#0D0D0D] border border-[#262626] rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden"
      >
        <div className="p-6 border-b border-[#262626] flex items-center justify-between bg-[#0A0A0A]">
          <h2 className="text-lg font-bold text-white">{contactToEdit ? 'Edit Contact' : 'New Contact'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#1A1A1A] text-gray-400 hover:text-white rounded-lg transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">First Name</label>
                <input 
                  required
                  className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" 
                  value={formData.first_name}
                  onChange={e => setFormData({...formData, first_name: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Last Name</label>
                <input 
                  required
                  className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" 
                  value={formData.last_name}
                  onChange={e => setFormData({...formData, last_name: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Company</label>
                <input 
                  className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" 
                  value={formData.company}
                  onChange={e => setFormData({...formData, company: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Job Title</label>
                <input 
                  className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" 
                  value={formData.jobTitle}
                  onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email</label>
                <input 
                  type="email"
                  className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Phone</label>
                <input 
                  className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Initial Value ($)</label>
                <input 
                  type="number"
                  className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold" 
                  value={formData.value}
                  onChange={e => setFormData({...formData, value: Number(e.target.value)})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Stage</label>
                <select 
                  className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="lead">Lead</option>
                  <option value="contacted">Contacted</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed">Closed</option>
                  <option value="lost">Lost</option>
                </select>
             </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-[#262626]">
             <button type="button" onClick={onClose} className="flex-1 py-3 px-4 bg-transparent border border-[#333] rounded-xl font-bold text-gray-400 hover:text-white hover:bg-[#1A1A1A] transition-all">Cancel</button>
             <button type="submit" className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all">Create Contact</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
