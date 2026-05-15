export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  name: string; // Combined for convenience
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  status: 'lead' | 'contacted' | 'proposal' | 'negotiation' | 'closed' | 'lost';
  value: number;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: number;
  contact_id: number;
  contact_name?: string;
  name: string;
  value: number;
  stage: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  close_date: string;
  created_at: string;
}

export interface Task {
  id: number;
  contact_id: number | null;
  deal_id: number | null;
  contact_name?: string;
  deal_name?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  reminder_offset: number | null; // minutes before due date
  due_date: string;
  completed: boolean;
  created_at: string;
}

export interface Note {
  id: number;
  contact_id: number | null;
  deal_id: number | null;
  content: string;
  created_at: string;
}

export interface Segment {
  id: number;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

export interface ContactSegment {
  contact_id: number;
  segment_id: number;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  email: string;
}
