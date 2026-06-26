import api from './api';

export interface Conversation {
  id: string;
  lead_id: string;
  business_id: string;
  channel: string; // sms, call, chat
  direction: string; // inbound, outbound
  content: string;
  ai_summary?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  lead_id: string;
  business_id: string;
  scheduled_at: string;
  status: string; // pending, confirmed, completed, cancelled
  service_type: string;
  notes?: string;
  reminders_sent: number;
  created_at: string;
}

export interface Lead {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  job_type: string;
  urgency: string; // Hot, Warm, Cold
  location: string;
  budget_range: string;
  status: string; // new, contacted, qualified, booked, lost
  ai_summary: string;
  tag: string; // hot, warm, cold
  created_at: string;
  updated_at: string;
  conversations?: Conversation[];
  bookings?: Booking[];
}

// Initial Mock Data
const INITIAL_LEADS: Lead[] = [
  {
    id: 'd5b4a8e2-0198-4c0a-8bf6-4b306b9b28a1',
    business_id: 'b1111111-1111-1111-1111-111111111111',
    name: 'David K.',
    phone: '(512) 555-0198',
    location: 'East Austin, TX',
    job_type: 'Roofing Leak Repair',
    urgency: 'Hot',
    status: 'booked',
    budget_range: '$1,200',
    tag: 'hot',
    ai_summary: 'Homeowner reported an active roofing leak dripping into the kitchen. Urgency is critical. Booked an inspection. Estimate range $1,000 - $1,500.',
    created_at: '2026-06-15T10:23:00Z',
    updated_at: '2026-06-15T10:27:00Z',
    conversations: [
      { id: 'c1', lead_id: 'd5b4a8e2-0198-4c0a-8bf6-4b306b9b28a1', business_id: 'b1111111-1111-1111-1111-111111111111', channel: 'sms', direction: 'inbound', content: 'Hi, I need a leak repaired on my roof in East Austin. Can you guys help?', created_at: '2026-06-15T10:23:00Z' },
      { id: 'c2', lead_id: 'd5b4a8e2-0198-4c0a-8bf6-4b306b9b28a1', business_id: 'b1111111-1111-1111-1111-111111111111', channel: 'sms', direction: 'outbound', content: 'Hi! Absolutely, we can help with leak repairs. To get you the best estimate, how soon are you looking to get this fixed, and has the leak caused any interior ceiling damage?', created_at: '2026-06-15T10:24:00Z' },
      { id: 'c3', lead_id: 'd5b4a8e2-0198-4c0a-8bf6-4b306b9b28a1', business_id: 'b1111111-1111-1111-1111-111111111111', channel: 'sms', direction: 'inbound', content: "ASAP please, it's dripping. No ceiling damage yet, just a spot.", created_at: '2026-06-15T10:25:00Z' },
      { id: 'c4', lead_id: 'd5b4a8e2-0198-4c0a-8bf6-4b306b9b28a1', business_id: 'b1111111-1111-1111-1111-111111111111', channel: 'sms', direction: 'outbound', content: 'Got it. That sounds urgent. I can book an inspector to come out tomorrow morning (June 16). Would 10:00 AM work best for you?', created_at: '2026-06-15T10:26:00Z' },
      { id: 'c5', lead_id: 'd5b4a8e2-0198-4c0a-8bf6-4b306b9b28a1', business_id: 'b1111111-1111-1111-1111-111111111111', channel: 'sms', direction: 'inbound', content: 'Yes, 10 AM is perfect. Thank you.', created_at: '2026-06-15T10:27:00Z' }
    ],
    bookings: [
      { id: 'bk1', lead_id: 'd5b4a8e2-0198-4c0a-8bf6-4b306b9b28a1', business_id: 'b1111111-1111-1111-1111-111111111111', scheduled_at: '2026-06-16T10:00:00Z', status: 'confirmed', service_type: 'Roofing Leak Repair', notes: 'Active roofing leak dripping into kitchen.', reminders_sent: 0, created_at: '2026-06-15T10:27:00Z' }
    ]
  },
  {
    id: 'a1b2c3d4-0144-4c0a-8bf6-4b306b9b28a2',
    business_id: 'b1111111-1111-1111-1111-111111111111',
    name: 'Sarah J.',
    phone: '(512) 555-0144',
    location: 'West Lake Hills, TX',
    job_type: 'AC Blowing Warm Air',
    urgency: 'Hot',
    status: 'qualified',
    budget_range: '$450',
    tag: 'hot',
    ai_summary: 'AC blowing warm air since yesterday. Family has a small toddler, making urgency very high due to current 95° Texas heat. Proposed tomorrow morning slots. Waiting for client confirmation.',
    created_at: '2026-06-15T09:12:00Z',
    updated_at: '2026-06-15T09:14:00Z',
    conversations: [
      { id: 'c6', lead_id: 'a1b2c3d4-0144-4c0a-8bf6-4b306b9b28a2', business_id: 'b1111111-1111-1111-1111-111111111111', channel: 'sms', direction: 'inbound', content: 'Hi, my air conditioner is blowing warm air. Do you have appointments today?', created_at: '2026-06-15T09:12:00Z' },
      { id: 'c7', lead_id: 'a1b2c3d4-0144-4c0a-8bf6-4b306b9b28a2', business_id: 'b1111111-1111-1111-1111-111111111111', channel: 'sms', direction: 'outbound', content: 'Hello Sarah! Yes, we can definitely help. Since it is blowing warm air, are any of your vents blowing any airflow at all? Also, do you have any infants or elderly individuals in the house?', created_at: '2026-06-15T09:13:00Z' },
      { id: 'c8', lead_id: 'a1b2c3d4-0144-4c0a-8bf6-4b306b9b28a2', business_id: 'b1111111-1111-1111-1111-111111111111', channel: 'sms', direction: 'inbound', content: 'The vents blow but it is hot air. Yes, I have a 18-month old baby and the house is already 82 degrees.', created_at: '2026-06-15T09:14:00Z' }
    ],
    bookings: []
  },
  {
    id: 'f9e8d7c6-0121-4c0a-8bf6-4b306b9b28a3',
    business_id: 'b1111111-1111-1111-1111-111111111111',
    name: 'Mike L.',
    phone: '(512) 555-0121',
    location: 'Round Rock, TX',
    job_type: 'HVAC Unit Replacement',
    urgency: 'Warm',
    status: 'contacted',
    budget_range: '$8,500',
    tag: 'warm',
    ai_summary: 'Client looking for estimates on a full system replacement (3-ton 16 SEER). Current unit is 14 years old and failing frequently. Moderate urgency. Triggered nurturing campaign with unit pricing sheets.',
    created_at: '2026-06-14T16:50:00Z',
    updated_at: '2026-06-14T16:50:00Z',
    conversations: [
      { id: 'c9', lead_id: 'f9e8d7c6-0121-4c0a-8bf6-4b306b9b28a3', business_id: 'b1111111-1111-1111-1111-111111111111', channel: 'sms', direction: 'inbound', content: "Looking for a quote to replace my old heat pump unit. It's about 14 years old.", created_at: '2026-06-14T16:50:00Z' }
    ],
    bookings: []
  },
  {
    id: '7d6c5b4a-0177-4c0a-8bf6-4b306b9b28a4',
    business_id: 'b1111111-1111-1111-1111-111111111111',
    name: 'Robert P.',
    phone: '(512) 555-0177',
    location: 'Pflugerville, TX',
    job_type: 'Main Drain Clog',
    urgency: 'Cold',
    status: 'lost',
    budget_range: '$350',
    tag: 'cold',
    ai_summary: 'Lead had a main sewer clog. AI followed up instantly but customer mentioned they already hired a local rooter company who was nearby. Marked as Lost Lead.',
    created_at: '2026-06-14T13:15:00Z',
    updated_at: '2026-06-14T13:18:00Z',
    conversations: [
      { id: 'c10', lead_id: '7d6c5b4a-0177-4c0a-8bf6-4b306b9b28a4', business_id: 'b1111111-1111-1111-1111-111111111111', channel: 'sms', direction: 'inbound', content: 'My main line is backed up. Can someone come out today?', created_at: '2026-06-14T13:15:00Z' },
      { id: 'c11', lead_id: '7d6c5b4a-0177-4c0a-8bf6-4b306b9b28a4', business_id: 'b1111111-1111-1111-1111-111111111111', channel: 'sms', direction: 'outbound', content: 'Hi Robert, we can absolutely dispatch a plumber for a main sewer drain line clear today. To confirm, is water backing up into your showers or tubs currently?', created_at: '2026-06-14T13:16:00Z' },
      { id: 'c12', lead_id: '7d6c5b4a-0177-4c0a-8bf6-4b306b9b28a4', business_id: 'b1111111-1111-1111-1111-111111111111', channel: 'sms', direction: 'inbound', content: 'Actually, nevermind, a plumber just knocked on my door. Thanks anyway.', created_at: '2026-06-14T13:18:00Z' }
    ],
    bookings: []
  }
];

// Helper to initialize LocalStorage if not present
const getStoredLeads = (): Lead[] => {
  const stored = localStorage.getItem('leadhive_leads');
  if (!stored) {
    localStorage.setItem('leadhive_leads', JSON.stringify(INITIAL_LEADS));
    return INITIAL_LEADS;
  }
  return JSON.parse(stored);
};

const saveStoredLeads = (leads: Lead[]) => {
  localStorage.setItem('leadhive_leads', JSON.stringify(leads));
};

export const leadService = {
  /**
   * Fetches all leads. Tries the real backend first, falls back to stateful localStorage.
   */
  async getLeads(params?: { status?: string; urgency?: string; q?: string }): Promise<Lead[]> {
    try {
      // Try backend endpoint
      const response = await api.get('/leads', { params });
      return response.data;
    } catch (error) {
      console.warn('API /leads failed or offline, falling back to localStorage mock:', error);
      
      let leads = getStoredLeads();

      // Apply filtering locally
      if (params) {
        const { status, urgency, q } = params;
        if (status && status !== 'All') {
          leads = leads.filter(l => l.status === status.toLowerCase());
        }
        if (urgency && urgency !== 'All') {
          leads = leads.filter(l => l.urgency.toLowerCase() === urgency.toLowerCase());
        }
        if (q) {
          const lowerQ = q.toLowerCase();
          leads = leads.filter(l => 
            l.name.toLowerCase().includes(lowerQ) ||
            l.phone.includes(lowerQ) ||
            l.job_type.toLowerCase().includes(lowerQ) ||
            l.location.toLowerCase().includes(lowerQ)
          );
        }
      }

      return leads;
    }
  },

  /**
   * Fetches a single lead by ID with details.
   */
  async getLeadById(id: string): Promise<Lead> {
    try {
      const response = await api.get(`/leads/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`API /leads/${id} failed or offline, falling back to localStorage mock.`);
      const leads = getStoredLeads();
      const lead = leads.find(l => l.id === id);
      if (!lead) throw new Error('Lead not found');
      return lead;
    }
  },

  /**
   * Updates lead status.
   */
  async updateLeadStatus(id: string, status: string): Promise<Lead> {
    try {
      const response = await api.patch(`/leads/${id}`, { status });
      return response.data;
    } catch (error) {
      console.warn(`API update lead status failed or offline, falling back to localStorage mock.`);
      const leads = getStoredLeads();
      const index = leads.findIndex(l => l.id === id);
      if (index === -1) throw new Error('Lead not found');

      leads[index] = {
        ...leads[index],
        status,
        updated_at: new Date().toISOString()
      };
      saveStoredLeads(leads);
      return leads[index];
    }
  },

  /**
   * Updates lead urgency.
   */
  async updateLeadUrgency(id: string, urgency: string): Promise<Lead> {
    try {
      const response = await api.patch(`/leads/${id}`, { urgency });
      return response.data;
    } catch (error) {
      console.warn(`API update lead urgency failed, falling back to localStorage mock.`);
      const leads = getStoredLeads();
      const index = leads.findIndex(l => l.id === id);
      if (index === -1) throw new Error('Lead not found');

      leads[index] = {
        ...leads[index],
        urgency,
        tag: urgency.toLowerCase(),
        updated_at: new Date().toISOString()
      };
      saveStoredLeads(leads);
      return leads[index];
    }
  },

  /**
   * Simulates sending an outbound SMS.
   * Updates the lead's conversation list.
   */
  async sendSMS(leadId: string, content: string): Promise<Conversation> {
    try {
      const response = await api.post(`/leads/${leadId}/conversations`, { content, channel: 'sms', direction: 'outbound' });
      return response.data;
    } catch (error) {
      console.warn(`API sendSMS failed, falling back to localStorage mock.`);
      const leads = getStoredLeads();
      const index = leads.findIndex(l => l.id === leadId);
      if (index === -1) throw new Error('Lead not found');

      const newMsg: Conversation = {
        id: `msg-${Date.now()}`,
        lead_id: leadId,
        business_id: leads[index].business_id,
        channel: 'sms',
        direction: 'outbound',
        content,
        created_at: new Date().toISOString()
      };

      if (!leads[index].conversations) {
        leads[index].conversations = [];
      }
      leads[index].conversations?.push(newMsg);
      
      // Update status to contacted if it was new
      if (leads[index].status === 'new') {
        leads[index].status = 'contacted';
      }

      leads[index].updated_at = new Date().toISOString();
      saveStoredLeads(leads);
      return newMsg;
    }
  },

  /**
   * Books a slot and registers it under the lead's bookings.
   */
  async bookAppointment(leadId: string, scheduledAt: string, serviceType: string, notes?: string): Promise<Booking> {
    try {
      const response = await api.post(`/bookings`, { lead_id: leadId, scheduled_at: scheduledAt, service_type: serviceType, notes });
      return response.data;
    } catch (error) {
      console.warn(`API bookAppointment failed, falling back to localStorage mock.`);
      const leads = getStoredLeads();
      const index = leads.findIndex(l => l.id === leadId);
      if (index === -1) throw new Error('Lead not found');

      const newBooking: Booking = {
        id: `bk-${Date.now()}`,
        lead_id: leadId,
        business_id: leads[index].business_id,
        scheduled_at: scheduledAt,
        status: 'confirmed',
        service_type: serviceType,
        notes: notes || '',
        reminders_sent: 0,
        created_at: new Date().toISOString()
      };

      if (!leads[index].bookings) {
        leads[index].bookings = [];
      }
      leads[index].bookings?.push(newBooking);
      
      // Update status to booked
      leads[index].status = 'booked';
      leads[index].updated_at = new Date().toISOString();
      
      saveStoredLeads(leads);
      return newBooking;
    }
  }
};
