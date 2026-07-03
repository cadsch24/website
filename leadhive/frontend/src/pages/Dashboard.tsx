import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  BarChart3,
  Target,
  Phone,
  XCircle,
} from 'lucide-react';
import { dashboardService, DashboardData, KpiCard, ActivityEvent, PipelineStage } from '../services/dashboardService';

const ICON_MAP: Record<string, React.ElementType> = {
  Users, PhoneMissed, Calendar, TrendingUp,
};

type TimeRange = 'today' | '7d' | '30d';

const RANGE_LABELS: Record<TimeRange, string> = {
  today: 'Today',
  '7d': '7 Days',
  '30d': '30 Days',
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const loadData = async (range: TimeRange) => {
    setLoading(true);
    try {
      const result = await dashboardService.getDashboardData(range);
      setData(result);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(timeRange);
  }, [timeRange]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'missed_call': return PhoneMissed;
      case 'booking': return Calendar;
      case 'qualification': return Sparkles;
      case 'sms': return MessageSquare;
      case 'lead_lost': return XCircle;
      default: return Clock;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'missed_call': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'booking': return 'bg-brand-50 text-brand-600 border-brand-100';
      case 'qualification': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'sms': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'lead_lost': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const maxPipelineValue = data?.pipeline ? Math.max(...data.pipeline.map(s => s.count), 1) : 1;
  const pipelineTotal = data?.pipeline?.reduce((sum, s) => sum + s.count, 0) || 0;

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
            LeadHive has recovered <span className="text-white font-semibold">
              {data ? Math.round(data.missedCallRecovery * data.totalLeads / 100) : '—'}
            </span> missed calls and booked <span className="text-white font-semibold">{data?.totalBookings || '—'}</span> jobs this period.
          </p>
        </div>
      </div>

      {/* Time Range Filter + Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {(Object.keys(RANGE_LABELS) as TimeRange[]).map(key => (
            <button
              key={key}
              onClick={() => setTimeRange(key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                timeRange === key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {RANGE_LABELS[key]}
            </button>
          ))}
        </div>
        <button
          onClick={() => loadData(timeRange)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !data ? (
        <div className="p-16 text-center text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-brand-500 mb-3" />
          <p className="text-sm font-medium">Loading dashboard...</p>
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.kpis.map((kpi, index) => {
              const Icon = ICON_MAP[kpi.icon] || Users;
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

          {/* Pipeline + Revenue Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Revenue Pipeline */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-brand-600" />
                  Revenue Pipeline
                </h3>
                <span className="text-xs font-semibold text-slate-400">{pipelineTotal} total</span>
              </div>
              <div className="mt-6 space-y-4">
                {data.pipeline.map((stage, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                        <span className="text-xs font-semibold text-slate-700">{stage.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-900">{stage.count}</span>
                        <span className="text-[10px] text-slate-400 w-14 text-right">${(stage.value / 1000).toFixed(1)}k</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${stage.color}`}
                        style={{ width: `${(stage.count / maxPipelineValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Pipeline Value</span>
                <span className="text-lg font-bold text-slate-900">
                  ${(data.pipeline.reduce((s, p) => s + p.value, 0) / 1000).toFixed(1)}k
                </span>
              </div>
            </div>

            {/* Conversion Metric */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center flex-1 flex flex-col justify-center">
                <div className="mx-auto p-3 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 mb-3">
                  <Target className="h-6 w-6" />
                </div>
                <span className="text-3xl font-bold text-slate-900">{data.conversionRate}%</span>
                <span className="text-xs font-semibold text-slate-400 mt-1">Lead-to-Booking</span>
                <span className="text-[10px] text-emerald-600 font-bold mt-2 inline-flex items-center justify-center">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> +3.2% vs last period
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center flex-1 flex flex-col justify-center">
                <div className="mx-auto p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 mb-3">
                  <Phone className="h-6 w-6" />
                </div>
                <span className="text-3xl font-bold text-slate-900">{data.missedCallRecovery}%</span>
                <span className="text-xs font-semibold text-slate-400 mt-1">Missed Call Recovery</span>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-900">Recent Activity</h3>
                <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full animate-pulse">
                  Live
                </span>
              </div>
              <div className="divide-y divide-slate-100 flex-1 overflow-y-auto mt-4 space-y-4">
                {data.recentActivity.map((event) => {
                  const EventIcon = getEventIcon(event.type);
                  return (
                    <div key={event.id} className="flex items-start justify-between pt-4 first:pt-0">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-xl mt-0.5 ${getEventColor(event.type)}`}>
                          <EventIcon className="h-4 w-4" />
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
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-16 text-center text-slate-400">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No dashboard data available</p>
        </div>
      )}
    </div>
  );
}