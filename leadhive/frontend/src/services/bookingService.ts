import api from './api';

export interface Booking {
  id: string;
  leadName: string;
  lead_id?: string;
  phone: string;
  serviceType: string;
  scheduledAt: string;
  timeSlot: string;
  location: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
  remindersSent: boolean;
  notes: string;
}

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'B-201',
    leadName: 'David K.',
    lead_id: 'd5b4a8e2-0198-4c0a-8bf6-4b306b9b28a1',
    phone: '(512) 555-0198',
    serviceType: 'Roofing Leak Repair',
    scheduledAt: 'June 16, 2026',
    timeSlot: '10:00 AM - 12:00 PM',
    location: 'East Austin, TX',
    status: 'Confirmed',
    remindersSent: true,
    notes: 'Customer reported dripping in the kitchen. Needs emergency inspection.'
  },
  {
    id: 'B-202',
    leadName: 'Sarah J.',
    lead_id: 'a1b2c3d4-0144-4c0a-8bf6-4b306b9b28a2',
    phone: '(512) 555-0144',
    serviceType: 'AC Diagnostics',
    scheduledAt: 'June 16, 2026',
    timeSlot: '01:30 PM - 03:00 PM',
    location: 'West Lake Hills, TX',
    status: 'Pending',
    remindersSent: false,
    notes: 'Vents blowing hot air. Home temperature is already 82°. Infant present.'
  },
  {
    id: 'B-203',
    leadName: 'Robert P.',
    lead_id: '7d6c5b4a-0177-4c0a-8bf6-4b306b9b28a4',
    phone: '(512) 555-0177',
    serviceType: 'Plumbing Service',
    scheduledAt: 'June 15, 2026',
    timeSlot: '04:00 PM - 05:30 PM',
    location: 'Pflugerville, TX',
    status: 'Completed',
    remindersSent: true,
    notes: 'Cleared backup in master bathroom shower drain.'
  }
];

const STORAGE_KEY = 'leadhive_bookings';

const getStoredBookings = (): Booking[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOOKINGS));
    return JSON.parse(JSON.stringify(INITIAL_BOOKINGS));
  }
  return JSON.parse(stored);
};

const saveStoredBookings = (bookings: Booking[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
};

export const bookingService = {
  async getBookings(params?: { status?: string }): Promise<Booking[]> {
    try {
      const response = await api.get('/bookings', { params });
      return response.data;
    } catch {
      console.warn('API /bookings failed, falling back to localStorage mock');
      let bookings = getStoredBookings();
      if (params?.status && params.status !== 'all') {
        bookings = bookings.filter(b => b.status.toLowerCase() === params.status!.toLowerCase());
      }
      return bookings;
    }
  },

  async proposeSlots(leadName: string, phone: string, slots: string[]): Promise<void> {
    try {
      await api.post('/bookings/propose', { lead_name: leadName, phone, slots });
    } catch {
      console.warn('API proposeSlots failed, falling back to localStorage mock');
      // No-op for mock — slot proposal is a notification action
    }
  },

  async updateBookingStatus(bookingId: string, status: string): Promise<Booking> {
    try {
      const response = await api.patch(`/bookings/${bookingId}`, { status });
      return response.data;
    } catch {
      console.warn('API updateBookingStatus failed, falling back to localStorage mock');
      const bookings = getStoredBookings();
      const index = bookings.findIndex(b => b.id === bookingId);
      if (index === -1) throw new Error('Booking not found');
      bookings[index].status = status as Booking['status'];
      saveStoredBookings(bookings);
      return bookings[index];
    }
  },

  async toggleReminders(bookingId: string): Promise<Booking> {
    try {
      const response = await api.post(`/bookings/${bookingId}/toggle-reminders`);
      return response.data;
    } catch {
      console.warn('API toggleReminders failed, falling back to localStorage mock');
      const bookings = getStoredBookings();
      const index = bookings.findIndex(b => b.id === bookingId);
      if (index === -1) throw new Error('Booking not found');
      bookings[index].remindersSent = !bookings[index].remindersSent;
      saveStoredBookings(bookings);
      return bookings[index];
    }
  },
};