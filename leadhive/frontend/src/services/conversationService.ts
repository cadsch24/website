import api from './api';

export interface ChatMessage {
  id: number;
  sender: 'lead' | 'ai' | 'business';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface ChatThread {
  id: number;
  lead_id: string;
  name: string;
  phone: string;
  service: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  urgency: string;
  messages: ChatMessage[];
}

const INITIAL_CHATS: ChatThread[] = [
  {
    id: 1,
    lead_id: 'd5b4a8e2-0198-4c0a-8bf6-4b306b9b28a1',
    name: 'David K.',
    phone: '(512) 555-0198',
    service: 'Roofing Leak Repair',
    lastMessage: 'Yes, 10 AM is perfect. Thank you.',
    time: '3 mins ago',
    unread: true,
    urgency: 'Hot',
    messages: [
      { id: 1, sender: 'lead', text: 'Hi, I need a leak repaired on my roof in East Austin. Can you guys help?', time: '10:23 AM' },
      { id: 2, sender: 'ai', text: 'Hi! Absolutely, we can help with leak repairs. To get you the best estimate, how soon are you looking to get this fixed, and has the leak caused any interior ceiling damage?', time: '10:24 AM' },
      { id: 3, sender: 'lead', text: "ASAP please, it's dripping. No ceiling damage yet, just a spot.", time: '10:25 AM' },
      { id: 4, sender: 'ai', text: 'Got it. That sounds urgent. I can book an inspector to come out tomorrow morning (June 16). Would 10:00 AM work best for you?', time: '10:26 AM' },
      { id: 5, sender: 'lead', text: 'Yes, 10 AM is perfect. Thank you.', time: '10:27 AM' }
    ]
  },
  {
    id: 2,
    lead_id: 'a1b2c3d4-0144-4c0a-8bf6-4b306b9b28a2',
    name: 'Sarah J.',
    phone: '(512) 555-0144',
    service: 'AC Blowing Warm Air',
    lastMessage: 'The vents blow but it is hot air. Yes, I have a 18-month old baby and the house is already 82 degrees.',
    time: '12 mins ago',
    unread: false,
    urgency: 'Hot',
    messages: [
      { id: 1, sender: 'lead', text: 'Hi, my air conditioner is blowing warm air. Do you have appointments today?', time: '9:12 AM' },
      { id: 2, sender: 'ai', text: 'Hello Sarah! Yes, we can definitely help. Since it is blowing warm air, are any of your vents blowing any airflow at all? Also, do you have any infants or elderly individuals in the house?', time: '9:13 AM' },
      { id: 3, sender: 'lead', text: 'The vents blow but it is hot air. Yes, I have a 18-month old baby and the house is already 82 degrees.', time: '9:14 AM' }
    ]
  },
  {
    id: 3,
    lead_id: 'f9e8d7c6-0121-4c0a-8bf6-4b306b9b28a3',
    name: 'Mike L.',
    phone: '(512) 555-0121',
    service: 'HVAC Unit Replacement',
    lastMessage: "Looking for a quote to replace my old heat pump unit. It's about 14 years old.",
    time: '1 hr ago',
    unread: false,
    urgency: 'Warm',
    messages: [
      { id: 1, sender: 'lead', text: "Looking for a quote to replace my old heat pump unit. It's about 14 years old.", time: '4:50 PM' }
    ]
  },
  {
    id: 4,
    lead_id: '7d6c5b4a-0177-4c0a-8bf6-4b306b9b28a4',
    name: 'Robert P.',
    phone: '(512) 555-0177',
    service: 'Main Drain Clog',
    lastMessage: 'Actually, nevermind, a plumber just knocked on my door. Thanks anyway.',
    time: '1 day ago',
    unread: false,
    urgency: 'Cold',
    messages: [
      { id: 1, sender: 'lead', text: 'My main line is backed up. Can someone come out today?', time: '1:15 PM' },
      { id: 2, sender: 'ai', text: 'Hi Robert, we can absolutely dispatch a plumber for a main sewer drain line clear today. To confirm, is water backing up into your showers or tubs currently?', time: '1:16 PM' },
      { id: 3, sender: 'lead', text: 'Actually, nevermind, a plumber just knocked on my door. Thanks anyway.', time: '1:18 PM' }
    ]
  }
];

const STORAGE_KEY = 'leadhive_conversations';

const getStoredChats = (): ChatThread[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CHATS));
    return INITIAL_CHATS;
  }
  return JSON.parse(stored);
};

const saveStoredChats = (chats: ChatThread[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
};

// Helper to compute relative time from ISO string
const timeAgo = (isoString: string): string => {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

const formatMessageTime = (isoString: string): string => {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const conversationService = {
  /**
   * Fetches all conversation threads. Tries the real backend first, falls back to localStorage.
   */
  async getConversations(): Promise<ChatThread[]> {
    try {
      // Try backend endpoint
      const response = await api.get('/conversations');
      // Map backend data to ChatThread format
      const rawData = response.data;
      if (Array.isArray(rawData) && rawData.length > 0) {
        return rawData.map((item: any, index: number) => ({
          id: index + 1,
          lead_id: item.lead_id || item.id,
          name: item.name || item.lead_name || 'Unknown',
          phone: item.phone || '',
          service: item.service || item.job_type || '',
          lastMessage: item.last_message || item.content || '',
          time: timeAgo(item.updated_at || item.created_at),
          unread: item.unread || false,
          urgency: item.urgency || item.tag || 'Warm',
          messages: Array.isArray(item.messages)
            ? item.messages.map((m: any, mi: number) => ({
                id: mi + 1,
                sender: m.direction === 'inbound' ? 'lead' : 'ai',
                text: m.content,
                time: formatMessageTime(m.created_at)
              }))
            : []
        }));
      }
      throw new Error('Unexpected response format');
    } catch (error) {
      console.warn('API /conversations failed or offline, falling back to localStorage mock:', error);
      return getStoredChats();
    }
  },

  /**
   * Sends an outbound SMS message.
   */
  async sendMessage(leadId: string, body: string): Promise<ChatMessage> {
    try {
      // Try the backend send endpoint
      await api.post('/conversations/send', null, {
        params: { lead_id: leadId, body }
      });
      // Return optimistic message
      const now = new Date();
      return {
        id: Date.now(),
        sender: 'business',
        text: body,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent'
      };
    } catch (error) {
      console.warn('API sendMessage failed, falling back to localStorage mock:', error);
      
      const chats = getStoredChats();
      const chatIndex = chats.findIndex(c => c.lead_id === leadId);
      
      if (chatIndex === -1) {
        throw new Error('Conversation thread not found');
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newMsg: ChatMessage = {
        id: Date.now(),
        sender: 'business',
        text: body,
        time: timeStr,
        status: 'sent'
      };

      chats[chatIndex] = {
        ...chats[chatIndex],
        lastMessage: body,
        time: 'Just now',
        messages: [...chats[chatIndex].messages, newMsg]
      };

      saveStoredChats(chats);
      return newMsg;
    }
  },

  /**
   * Marks a conversation as read.
   */
  async markAsRead(chatId: number): Promise<void> {
    try {
      await api.patch(`/conversations/${chatId}/read`);
    } catch {
      // Fallback: update localStorage
      const chats = getStoredChats();
      const index = chats.findIndex(c => c.id === chatId);
      if (index !== -1) {
        chats[index].unread = false;
        saveStoredChats(chats);
      }
    }
  },

  /**
   * Gets templates for quick responses.
   */
  getTemplates() {
    return [
      { name: 'Ask for photos', text: 'Could you please text us 2-3 photos of the problem area? This will help our technicians review and prepare better.' },
      { name: 'Confirm Booking', text: 'All set! Your appointment is confirmed for tomorrow. Our technician will text you when they are on their way.' },
      { name: 'Send Pricing Est.', text: 'Our standard diagnostic fee is $89, which is fully applied toward any repairs we perform for you today.' }
    ];
  }
};