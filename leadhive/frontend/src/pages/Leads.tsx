import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  PlusCircle,
  Send,
  Check,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { leadService, Lead, Conversation, Booking } from '../services/leadService';

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Quick Actions & Modal State
  const [smsText, setSmsText] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingService, setBookingService] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Fetch leads on load or when filters change
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await leadService.getLeads({
        q: searchTerm,
        urgency: urgencyFilter,
        status: statusFilter
      });
      setLeads(data);
      // Keep selected lead reference sync'd if open
      if (selectedLead) {
        const updatedSelected = data.find(l => l.id === selectedLead.id);
        if (updatedSelected) {
          setSelectedLead(updatedSelected);
        }
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [searchTerm, urgencyFilter, statusFilter]);

  // Handle Send SMS Action
  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !smsText.trim()) return;

    try {
      await leadService.sendSMS(selectedLead.id, smsText);
      setSmsText('');
      await fetchLeads(); // Refresh list to get updated logs and status
    } catch (err) {
      alert('Failed to send message.');
    }
  };

  // Handle Status Update Action
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedLead) return;

    try {
      await leadService.updateLeadStatus(selectedLead.id, newStatus);
      setIsStatusDropdownOpen(false);
      await fetchLeads();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  // Handle Create Booking Action
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !bookingDate || !bookingTime || !bookingService) return;

    const scheduledAt = `${bookingDate}T${bookingTime}:00Z`;

    try {
      await leadService.bookAppointment(
        selectedLead.id,
        scheduledAt,
        bookingService,
        bookingNotes
      );
      // Reset form & state
      setBookingDate('');
      setBookingTime('');
      setBookingService('');
      setBookingNotes('');
      setIsBookingModalOpen(false);
      await fetchLeads();
    } catch (err) {
      alert('Failed to book appointment.');
    }
  };

  // Helpers for formatting Badges
  const getUrgencyBadge = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'hot':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'warm':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'cold':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'booked':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'qualified':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'contacted':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'lost':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'new':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 relative min-h-[calc(100vh-6rem)]">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Lead CRM Pipeline</h2>
          <p className="text-sm text-slate-500 mt-1">Review AI qualification profiles, converse with leads via SMS, and track bookings.</p>
        </div>
        <button 
          onClick={fetchLeads} 
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm font-medium self-start md:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Pipeline
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by name, phone, or service type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm transition-all duration-200"
          />
        </div>

        {/* Urgency Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400 hidden md:block" />
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="w-full md:w-40 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:bg-white transition-colors"
          >
            <option value="All">All Urgencies</option>
            <option value="Hot">🔥 Hot</option>
            <option value="Warm">☀️ Warm</option>
            <option value="Cold">❄️ Cold</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-44 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:bg-white transition-colors"
          >
            <option value="All">All Statuses</option>
            <option value="new">🆕 New</option>
            <option value="contacted">💬 Contacted</option>
            <option value="qualified">✨ Qualified</option>
            <option value="booked">📅 Booked</option>
            <option value="lost">❌ Lost</option>
          </select>
        </div>
      </div>

      {/* Main Grid: List + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Leads Table Card */}
        <div className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${
          selectedLead ? 'lg:col-span-7' : 'lg:col-span-12'
        }`}>
          <div className="overflow-x-auto">
            {loading && leads.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-brand-500 mb-2" />
                Loading pipeline...
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-xs font-bold text-slate-400 tracking-wider">
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Job / Request Type</th>
                    <th className="px-6 py-4">Urgency</th>
                    <th className="px-6 py-4">Est. Value</th>
                    <th className="px-6 py-4">Pipeline Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {leads.length > 0 ? (
                    leads.map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                          selectedLead?.id === lead.id ? 'bg-brand-50/30 hover:bg-brand-50/30' : ''
                        }`}
                      >
                        {/* Name */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{lead.name}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{lead.phone}</div>
                        </td>

                        {/* Job type */}
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {lead.job_type}
                          <div className="text-[10px] text-slate-400 flex items-center mt-0.5">
                            <MapPin className="h-3 w-3 mr-0.5" />
                            {lead.location}
                          </div>
                        </td>

                        {/* Urgency */}
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getUrgencyBadge(lead.urgency)}`}>
                            {lead.urgency}
                          </span>
                        </td>

                        {/* Budget */}
                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {lead.budget_range}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase ${getStatusBadge(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>

                        {/* Arrow */}
                        <td className="px-6 py-4 text-right">
                          <button className="p-1 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors">
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                        No leads matched your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Lead Detail Slide-Over Panel */}
        {selectedLead && (
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-md p-6 space-y-6 animate-in fade-in slide-in-from-right duration-200 sticky top-20">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-400 font-mono">Lead ID: {selectedLead.id.slice(0, 8)}</span>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg shadow-inner">
                {selectedLead.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-800 truncate">{selectedLead.name}</h3>
                <p className="text-xs text-slate-500 flex items-center mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 mr-1" />
                  {selectedLead.location}
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getUrgencyBadge(selectedLead.urgency)}`}>
                {selectedLead.urgency} Urgency
              </span>
            </div>

            {/* AI Summary Box */}
            <div className="bg-gradient-to-br from-brand-50/50 to-indigo-50/20 border border-brand-100 rounded-2xl p-4 space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-16 w-16 bg-brand-500/5 rounded-full blur-xl" />
              <div className="flex items-center space-x-1.5 text-brand-700 font-bold text-sm">
                <Sparkles className="h-4.5 w-4.5 text-brand-500" />
                <span>AI Qualification Summary</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {selectedLead.ai_summary}
              </p>
            </div>

            {/* Grid Attributes */}
            <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Phone Number</span>
                <span className="font-bold text-slate-700 flex items-center">
                  <Phone className="h-3.5 w-3.5 text-slate-400 mr-1" />
                  {selectedLead.phone}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Request Type</span>
                <span className="font-bold text-slate-700 block truncate">{selectedLead.job_type}</span>
              </div>
              <div className="space-y-1 mt-2">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Est. Revenue</span>
                <span className="font-bold text-slate-700 flex items-center">
                  <DollarSign className="h-3.5 w-3.5 text-slate-400 mr-0.5" />
                  {selectedLead.budget_range}
                </span>
              </div>
              <div className="space-y-1 mt-2">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Created Date</span>
                <span className="font-bold text-slate-700 flex items-center">
                  <Calendar className="h-3.5 w-3.5 text-slate-400 mr-1" />
                  {new Date(selectedLead.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Conversation Snippet Preview */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">SMS Chat Log</h4>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-h-56 overflow-y-auto space-y-3 text-xs flex flex-col">
                {selectedLead.conversations && selectedLead.conversations.length > 0 ? (
                  selectedLead.conversations.map((msg, i) => (
                    <div key={i} className={`flex flex-col space-y-0.5 ${msg.direction === 'outbound' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {msg.direction === 'outbound' ? 'Business App' : 'Lead'}
                      </span>
                      <div className={`p-2.5 rounded-xl max-w-[85%] ${
                        msg.direction === 'outbound' 
                          ? 'bg-brand-600 text-white rounded-tr-none' 
                          : 'bg-white text-slate-700 border border-slate-200/60 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-center py-4 text-slate-400 font-medium">
                    No conversation history.
                  </span>
                )}
              </div>

              {/* Message Composer */}
              <form onSubmit={handleSendSMS} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type an SMS response..."
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white focus:border-brand-500"
                />
                <button
                  type="submit"
                  disabled={!smsText.trim()}
                  className="px-3 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-colors disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-2 flex items-center gap-3 relative">
              <button 
                onClick={() => setIsBookingModalOpen(true)}
                className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-900/10"
              >
                <Calendar className="h-4 w-4" />
                <span>Book Slot</span>
              </button>

              {/* Status Update Trigger */}
              <div className="flex-1 relative">
                <button 
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="w-full flex items-center justify-center space-x-1.5 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Update Status</span>
                </button>

                {isStatusDropdownOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="px-3 py-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100">
                      Pipeline Status
                    </div>
                    {['new', 'contacted', 'qualified', 'booked', 'lost'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(st)}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between"
                      >
                        <span className="capitalize">{st}</span>
                        {selectedLead.status === st && <Check className="h-3.5 w-3.5 text-brand-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal Overlay */}
      {isBookingModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="h-5 w-5 text-brand-600" />
                Book Slot for {selectedLead.name}
              </h3>
              <button 
                onClick={() => setIsBookingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200/50 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateBooking} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Service Type</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AC Inspection / Roof Leak Assessment"
                  value={bookingService || selectedLead.job_type}
                  onChange={(e) => setBookingService(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:bg-white focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:bg-white focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Time</label>
                  <input
                    type="time"
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:bg-white focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Notes / AI Summary Stub</label>
                <textarea
                  placeholder="Special instructions or customer request details..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:bg-white focus:border-brand-500 resize-none"
                />
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-brand-900/10"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
