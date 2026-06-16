import React, { useState } from 'react';
import {
  Search,
  Filter,
  Users,
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
  UserCheck
} from 'lucide-react';

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLead, setSelectedLead] = useState(null);

  const initialLeads = [
    {
      id: 'L-101',
      name: 'David K.',
      phone: '(512) 555-0198',
      email: 'david.k@gmail.com',
      location: 'East Austin, TX',
      jobType: 'Roofing Leak Repair',
      urgency: 'Hot',
      status: 'Booked',
      budget: '$1,200',
      aiSummary: 'Homeowner reported an active roofing leak dripping into the kitchen. Urgency is critical. Booked an inspection for June 16 at 10:00 AM. Estimate range $1,000 - $1,500.',
      created_at: 'June 15, 2026 10:23 AM',
      conversations: [
        { sender: 'Lead', text: 'Hi, I need a leak repaired on my roof in East Austin. Can you guys help?', time: '10:23 AM' },
        { sender: 'AI', text: 'Hi! Absolutely, we can help with leak repairs. To get you the best estimate, how soon are you looking to get this fixed, and has the leak caused any interior ceiling damage?', time: '10:24 AM' },
        { sender: 'Lead', text: 'ASAP please, it\'s dripping. No ceiling damage yet, just a spot.', time: '10:25 AM' },
        { sender: 'AI', text: 'Got it. That sounds urgent. I can book an inspector to come out tomorrow morning (June 16). Would 10:00 AM work best for you?', time: '10:26 AM' },
        { sender: 'Lead', text: 'Yes, 10 AM is perfect. Thank you.', time: '10:27 AM' }
      ]
    },
    {
      id: 'L-102',
      name: 'Sarah J.',
      phone: '(512) 555-0144',
      email: 'sarah.j@hotmail.com',
      location: 'West Lake Hills, TX',
      jobType: 'AC Blowing Warm Air',
      urgency: 'Hot',
      status: 'Qualified',
      budget: '$450',
      aiSummary: 'AC blowing warm air since yesterday. Family has a small toddler, making urgency very high due to current 95° Texas heat. Proposed tomorrow morning slots. Waiting for client confirmation.',
      created_at: 'June 15, 2026 09:12 AM',
      conversations: [
        { sender: 'Lead', text: 'Hi, my air conditioner is blowing warm air. Do you have appointments today?', time: '9:12 AM' },
        { sender: 'AI', text: 'Hello Sarah! Yes, we can definitely help. Since it is blowing warm air, are any of your vents blowing any airflow at all? Also, do you have any infants or elderly individuals in the house?', time: '9:13 AM' },
        { sender: 'Lead', text: 'The vents blow but it is hot air. Yes, I have a 18-month old baby and the house is already 82 degrees.', time: '9:14 AM' }
      ]
    },
    {
      id: 'L-103',
      name: 'Mike L.',
      phone: '(512) 555-0121',
      email: 'mikel@outlook.com',
      location: 'Round Rock, TX',
      jobType: 'HVAC Unit Replacement',
      urgency: 'Warm',
      status: 'Contacted',
      budget: '$8,500',
      aiSummary: 'Client looking for estimates on a full system replacement (3-ton 16 SEER). Current unit is 14 years old and failing frequently. Moderate urgency. Triggered nurturing campaign with unit pricing sheets.',
      created_at: 'June 14, 2026 04:50 PM',
      conversations: [
        { sender: 'Lead', text: 'Looking for a quote to replace my old heat pump unit. It\'s about 14 years old.', time: '4:50 PM' }
      ]
    },
    {
      id: 'L-104',
      name: 'Robert P.',
      phone: '(512) 555-0177',
      email: 'rob.peters@gmail.com',
      location: 'Pflugerville, TX',
      jobType: 'Main Drain Clog',
      urgency: 'Cold',
      status: 'Lost',
      budget: '$350',
      aiSummary: 'Lead had a main sewer clog. AI followed up instantly but customer mentioned they already hired a local rooter company who was nearby. Marked as Lost Lead.',
      created_at: 'June 14, 2026 01:15 PM',
      conversations: [
        { sender: 'Lead', text: 'My main line is backed up. Can someone come out today?', time: '1:15 PM' },
        { sender: 'AI', text: 'Hi Robert, we can absolutely dispatch a plumber for a main sewer drain line clear today. To confirm, is water backing up into your showers or tubs currently?', time: '1:16 PM' },
        { sender: 'Lead', text: 'Actually, nevermind, a plumber just knocked on my door. Thanks anyway.', time: '1:18 PM' }
      ]
    }
  ];

  const [leads, setLeads] = useState(initialLeads);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.jobType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUrgency = urgencyFilter === 'All' || lead.urgency === urgencyFilter;
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;

    return matchesSearch && matchesUrgency && matchesStatus;
  });

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'Hot':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Warm':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Cold':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Booked':
        return 'bg-brand-50 text-brand-700 border-brand-200';
      case 'Qualified':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Contacted':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Lost':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header section with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Leads CRM Pipeline</h2>
          <p className="text-sm text-slate-500 mt-1">Review AI lead qualification summaries and manage your customer pipeline.</p>
        </div>
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
            <option value="Booked">📅 Booked</option>
            <option value="Qualified">✨ Qualified</option>
            <option value="Contacted">💬 Contacted</option>
            <option value="Lost">❌ Lost</option>
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
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
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
                        {lead.jobType}
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
                        {lead.budget}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(lead.status)}`}>
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
                    <td colSpan="6" className="text-center py-12 text-slate-400 font-medium">
                      No leads matched your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead Detail Slide-Over Panel */}
        {selectedLead && (
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-md p-6 space-y-6 animate-in fade-in slide-in-from-right duration-200 sticky top-20">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-400 font-mono">Lead ID: {selectedLead.id}</span>
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
                {selectedLead.aiSummary}
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
                <span className="font-bold text-slate-700 block truncate">{selectedLead.jobType}</span>
              </div>
              <div className="space-y-1 mt-2">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Est. Revenue</span>
                <span className="font-bold text-slate-700 flex items-center">
                  <DollarSign className="h-3.5 w-3.5 text-slate-400 mr-0.5" />
                  {selectedLead.budget}
                </span>
              </div>
              <div className="space-y-1 mt-2">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Inbound Source</span>
                <span className="font-bold text-slate-700 flex items-center">
                  <Calendar className="h-3.5 w-3.5 text-slate-400 mr-1" />
                  {selectedLead.created_at.split(' ').slice(0, 3).join(' ')}
                </span>
              </div>
            </div>

            {/* Conversation Snippet Preview */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">SMS Chat Log Preview</h4>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-h-48 overflow-y-auto space-y-3 text-xs">
                {selectedLead.conversations.map((msg, i) => (
                  <div key={i} className={`flex flex-col space-y-0.5 ${msg.sender === 'AI' ? 'items-end' : ''}`}>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{msg.sender}</span>
                    <div className={`p-2.5 rounded-xl max-w-[85%] ${
                      msg.sender === 'AI' ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-200/60 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-2 flex items-center gap-3">
              <button className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-900/10">
                <MessageSquare className="h-4 w-4" />
                <span>Text Client</span>
              </button>
              <button className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
                <UserCheck className="h-4 w-4" />
                <span>Update Status</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
