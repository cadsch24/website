import React from 'react';
import {
  TrendingUp,
  Users,
  Calendar,
  PhoneMissed,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const kpis = [
    {
      name: 'Leads Captured',
      value: '142',
      change: '+18.2%',
      isPositive: true,
      timeframe: 'vs last week',
      icon: Users,
      color: 'text-brand-600',
      bgColor: 'bg-brand-50 border-brand-100',
    },
    {
      name: 'Recovery Rate',
      value: '48.6%',
      change: '+4.3%',
      isPositive: true,
      timeframe: 'vs last week',
      icon: PhoneMissed,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 border-rose-100',
    },
    {
      name: 'Appts Booked',
      value: '38',
      change: '+12.5%',
      isPositive: true,
      timeframe: 'vs last week',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-100',
    },
    {
      name: 'Est. Revenue',
      value: '$24,700',
      change: '+22.1%',
      isPositive: true,
      timeframe: 'vs last week',
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border-amber-100',
    },
  ];

  const recentEvents = [
    {
      id: 1,
      type: 'missed_call',
      title: 'Missed Call Recovered',
      description: 'Auto-text sent to (512) 555-0198. Lead replied and got qualified.',
      time: '3 mins ago',
      status: 'success',
      tag: 'Hot Lead',
      tagColor: 'bg-rose-100 text-rose-800'
    },
    {
      id: 2,
      type: 'booking',
      title: 'Appointment Confirmed',
      description: 'David K. booked Roofing Inspection for tomorrow at 10:00 AM.',
      time: '24 mins ago',
      status: 'success',
      tag: 'Booked',
      tagColor: 'bg-brand-100 text-brand-800'
    },
    {
      id: 3,
      type: 'qualification',
      title: 'Lead Qualified by AI',
      description: 'Sarah J. (AC Leak) qualified. Tagged as High Urgency / High Budget.',
      time: '1 hour ago',
      status: 'info',
      tag: 'Hot Lead',
      tagColor: 'bg-rose-100 text-rose-800'
    },
    {
      id: 4,
      type: 'sms',
      title: 'SMS Follow-up Sent',
      description: 'Sequence "24-Hour Nurture" triggered for Mike L. (HVAC installation).',
      time: '2 hours ago',
      status: 'pending',
      tag: 'Nurturing',
      tagColor: 'bg-amber-100 text-amber-800'
    },
  ];

  const activeLeads = [
    { name: 'David K.', phone: '(512) 555-0198', service: 'Roofing Leak', tag: 'Hot', status: 'Booked' },
    { name: 'Sarah J.', phone: '(512) 555-0144', service: 'AC Repair', tag: 'Hot', status: 'Qualified' },
    { name: 'Mike L.', phone: '(512) 555-0121', service: 'HVAC Install', tag: 'Warm', status: 'Contacted' },
    { name: 'Robert P.', phone: '(512) 555-0177', service: 'Plumbing Clog', tag: 'Cold', status: 'New' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 h-40 w-40 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 bg-brand-500/20 text-brand-300 border border-brand-500/30 px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="h-3 w-3" />
            <span>AI Assistant Active</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back, Acme Services!</h2>
          <p className="text-slate-400 max-w-xl text-sm md:text-base">
            LeadHive has recovered <span className="text-white font-semibold">18 missed calls</span> and booked <span className="text-white font-semibold">12 new jobs</span> for you this week.
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">{kpi.name}</span>
                <div className={`${kpi.bgColor} ${kpi.color} p-2 rounded-xl border`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold text-slate-900">{kpi.value}</span>
                <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                  kpi.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {kpi.isPositive ? <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> : <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />}
                  {kpi.change}
                </span>
              </div>
              <p className="text-xs text-slate-400">{kpi.timeframe}</p>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-bold text-lg text-slate-900">LeadHive Live Pipeline</h3>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full animate-pulse">
              Syncing Live
            </span>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto mt-4 space-y-4">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-start justify-between pt-4 first:pt-0">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-xl mt-0.5 ${
                    event.type === 'missed_call' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                    event.type === 'booking' ? 'bg-brand-50 text-brand-600 border border-brand-100' :
                    event.type === 'qualification' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                    'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {event.type === 'missed_call' ? <PhoneMissed className="h-4 w-4" /> :
                     event.type === 'booking' ? <Calendar className="h-4 w-4" /> :
                     event.type === 'qualification' ? <Sparkles className="h-4 w-4" /> :
                     <MessageSquare className="h-4 w-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{event.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{event.description}</p>
                    <span className="text-[10px] font-medium text-slate-400 flex items-center mt-1.5">
                      <Clock className="h-3 w-3 mr-1" />
                      {event.time}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${event.tagColor}`}>
                  {event.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Summary Matrix */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="font-bold text-lg text-slate-900 font-sans">Active Inbound Leads</h3>
          </div>

          <div className="flex-1 mt-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead>
                  <tr className="text-xs font-semibold text-slate-400 tracking-wider">
                    <th className="pb-3">Lead</th>
                    <th className="pb-3">Service</th>
                    <th className="pb-3">Urgency</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {activeLeads.map((lead, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3.5 pr-2">
                        <div className="font-semibold text-slate-800">{lead.name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{lead.phone}</div>
                      </td>
                      <td className="py-3.5 text-slate-600">{lead.service}</td>
                      <td className="py-3.5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          lead.tag === 'Hot' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          lead.tag === 'Warm' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {lead.tag}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-semibold">
                        <span className={`text-xs font-bold ${
                          lead.status === 'Booked' ? 'text-brand-600' :
                          lead.status === 'Qualified' ? 'text-indigo-600' :
                          lead.status === 'Contacted' ? 'text-amber-600' :
                          'text-slate-500'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Actions / Integration Status */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Integration Health</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 bg-emerald-50/40 border border-emerald-100 rounded-xl p-2.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-800">Twilio SMS</span>
                </div>
                <div className="flex items-center space-x-2 bg-emerald-50/40 border border-emerald-100 rounded-xl p-2.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-800">Google Calendar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
