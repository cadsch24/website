import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Sparkles,
  Sliders,
  MapPin,
  BellRing,
  RefreshCw,
} from 'lucide-react';
import { bookingService, Booking } from '../services/bookingService';

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedSlotLead, setSelectedSlotLead] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const activeBookings = bookings.filter((b) => {
    if (activeTab === 'upcoming') return b.status === 'Confirmed' || b.status === 'Pending';
    if (activeTab === 'completed') return b.status === 'Completed';
    return true;
  });

  const handleProposeSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotLead.trim()) return;

    try {
      await bookingService.proposeSlots(selectedSlotLead, '', ['Tomorrow 9 AM', 'Tomorrow 1:30 PM', 'Wed 10:30 AM']);
      setShowSlotModal(false);
      setSelectedSlotLead('');
    } catch (err) {
      console.error('Failed to propose slots:', err);
    }
  };

  const handleToggleReminders = async (bookingId: string) => {
    try {
      const updated = await bookingService.toggleReminders(bookingId);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, remindersSent: updated.remindersSent } : b));
    } catch (err) {
      console.error('Failed to toggle reminders:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Completed': return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'Cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Calendar Bookings</h2>
          <p className="text-sm text-slate-500 mt-1">Manage booked appointments and trigger automated SMS calendar proposals.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchBookings}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowSlotModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-900/10 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>Propose Time Slots via SMS</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Appointments List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-3 pr-6 ${activeTab === 'upcoming'
                ? 'border-b-2 border-brand-600 text-brand-600'
                : 'text-slate-400 hover:text-slate-600'}`}
            >
              Upcoming ({bookings.filter(b => b.status !== 'Completed').length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`pb-3 px-6 ${activeTab === 'completed'
                ? 'border-b-2 border-brand-600 text-brand-600'
                : 'text-slate-400 hover:text-slate-600'}`}
            >
              Completed ({bookings.filter(b => b.status === 'Completed').length})
            </button>
          </div>

          {/* Cards */}
          {loading && bookings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center text-slate-400 font-medium">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-brand-500 mb-2" />
              Loading appointments...
            </div>
          ) : activeBookings.length > 0 ? (
            <div className="space-y-4">
              {activeBookings.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(appt.status)}`}>
                        {appt.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Appt ID: {appt.id}</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                      <h3 className="font-extrabold text-base text-slate-800 flex items-center">
                        <User className="h-4 w-4 mr-1.5 text-slate-400" />
                        {appt.leadName}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono flex items-center">
                        <Phone className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                        {appt.phone}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                        <span className="font-semibold text-slate-800">{appt.scheduledAt}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-slate-400" />
                        <span className="font-semibold text-slate-800">{appt.timeSlot}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      <span className="font-semibold text-slate-500">Job Note:</span> {appt.notes}
                    </p>
                  </div>

                  <div className="flex flex-col justify-between items-end gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 flex-shrink-0">
                    <div className="flex items-center space-x-1 text-slate-500 text-xs font-semibold">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>{appt.location}</span>
                    </div>

                    <button
                      onClick={() => handleToggleReminders(appt.id)}
                      className="cursor-pointer"
                    >
                      {appt.remindersSent ? (
                        <div className="flex items-center text-emerald-600 text-xs font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors">
                          <BellRing className="h-3.5 w-3.5 mr-1" />
                          <span>SMS Reminders Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-slate-400 text-xs font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                          <BellRing className="h-3.5 w-3.5 mr-1 text-slate-300" />
                          <span>Reminders Inactive</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center text-slate-400 font-medium">
              No appointments listed for this status.
            </div>
          )}
        </div>

        {/* Business Settings Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-3 flex items-center">
              <Sliders className="h-4.5 w-4.5 mr-2 text-brand-600" />
              <span>Calendar Config</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Connected Feed</span>
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 font-semibold p-2.5 rounded-xl flex items-center justify-between">
                  <span>Google Calendar (active)</span>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Dispatch Slot Size</span>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-medium text-slate-700">
                  <option>1.5 Hours Slot Duration</option>
                  <option>2.0 Hours Slot Duration</option>
                  <option>3.0 Hours Slot Duration</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Business Booking Window</span>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div className="bg-slate-50 p-2 rounded-xl text-center font-bold">08:00 AM</div>
                  <div className="bg-slate-50 p-2 rounded-xl text-center font-bold">05:00 PM</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Buffer Time</span>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-medium text-slate-700">
                  <option>30 mins transit buffer</option>
                  <option>45 mins transit buffer</option>
                  <option>No buffer required</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Propose slots modal */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center">
                <Sparkles className="h-4.5 w-4.5 mr-1.5 text-brand-600" />
                <span>SMS AI Slot Proposal</span>
              </h3>
              <button
                onClick={() => setShowSlotModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProposeSlots} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase tracking-wider block">Select Lead / Phone</label>
                <input
                  type="text"
                  placeholder="e.g. David K. (512) 555-0198"
                  value={selectedSlotLead}
                  onChange={(e) => setSelectedSlotLead(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none font-semibold text-slate-700"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase tracking-wider block">Slots to Propose</label>
                <div className="space-y-2 text-slate-600 font-bold">
                  {['Tomorrow, June 16 — 09:00 AM', 'Tomorrow, June 16 — 01:30 PM', 'Wednesday, June 17 — 10:30 AM'].map((slot, i) => (
                    <div key={i} className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2 h-4 w-4 accent-brand-600" />
                      <span>{slot}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-brand-50 border border-brand-100 text-slate-600 p-3 rounded-xl font-medium leading-relaxed">
                <span className="font-bold text-brand-800">Preview Message:</span> "Hi! We have opening slots tomorrow at 9 AM or 1:30 PM, or Wed at 10:30 AM. Which option fits your schedule?"
              </div>

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl transition-colors shadow-md"
              >
                Send Proposal SMS
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}