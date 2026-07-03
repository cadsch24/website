import api from './api';

export interface KpiCard {
  name: string;
  value: string;
  change: string;
  isPositive: boolean;
  timeframe: string;
  icon: string;
  color: string;
  bgColor: string;
}

export interface PipelineStage {
  name: string;
  count: number;
  value: number;
  color: string;
}

export interface ActivityEvent {
  id: number;
  type: 'missed_call' | 'booking' | 'qualification' | 'sms' | 'lead_lost';
  title: string;
  description: string;
  time: string;
  tag: string;
  tagColor: string;
}

export interface DashboardData {
  kpis: KpiCard[];
  pipeline: PipelineStage[];
  recentActivity: ActivityEvent[];
  conversionRate: number;
  totalLeads: number;
  totalBookings: number;
  missedCallRecovery: number;
}

const INITIAL_DASHBOARD: DashboardData = {
  kpis: [
    {
      name: 'Leads Captured',
      value: '142',
      change: '+18.2%',
      isPositive: true,
      timeframe: 'vs last week',
      icon: 'Users',
      color: 'text-brand-600',
      bgColor: 'bg-brand-50 border-brand-100',
    },
    {
      name: 'Recovery Rate',
      value: '48.6%',
      change: '+4.3%',
      isPositive: true,
      timeframe: 'vs last week',
      icon: 'PhoneMissed',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 border-rose-100',
    },
    {
      name: 'Appts Booked',
      value: '38',
      change: '+12.5%',
      isPositive: true,
      timeframe: 'vs last week',
      icon: 'Calendar',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-100',
    },
    {
      name: 'Est. Revenue',
      value: '$24,700',
      change: '+22.1%',
      isPositive: true,
      timeframe: 'vs last week',
      icon: 'TrendingUp',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border-amber-100',
    },
  ],
  pipeline: [
    { name: 'New Leads', count: 48, value: 48000, color: 'bg-blue-500' },
    { name: 'Contacted', count: 32, value: 42000, color: 'bg-amber-500' },
    { name: 'Qualified', count: 24, value: 54000, color: 'bg-indigo-500' },
    { name: 'Booked', count: 18, value: 38000, color: 'bg-brand-500' },
    { name: 'Lost', count: 12, value: 15000, color: 'bg-rose-400' },
  ],
  recentActivity: [
    { id: 1, type: 'missed_call', title: 'Missed Call Recovered', description: 'Auto-text sent to (512) 555-0198. Lead replied and got qualified.', time: '3 mins ago', tag: 'Hot Lead', tagColor: 'bg-rose-100 text-rose-800' },
    { id: 2, type: 'booking', title: 'Appointment Confirmed', description: 'David K. booked Roofing Inspection for tomorrow at 10:00 AM.', time: '24 mins ago', tag: 'Booked', tagColor: 'bg-brand-100 text-brand-800' },
    { id: 3, type: 'qualification', title: 'Lead Qualified by AI', description: 'Sarah J. (AC Leak) qualified. Tagged as High Urgency.', time: '1 hour ago', tag: 'Hot Lead', tagColor: 'bg-rose-100 text-rose-800' },
    { id: 4, type: 'sms', title: 'SMS Follow-up Sent', description: 'Sequence "24-Hour Nurture" triggered for Mike L. (HVAC installation).', time: '2 hours ago', tag: 'Nurturing', tagColor: 'bg-amber-100 text-amber-800' },
    { id: 5, type: 'lead_lost', title: 'Lead Lost', description: 'Robert P. (Plumbing Clog) hired a competitor who arrived first.', time: '1 day ago', tag: 'Lost', tagColor: 'bg-slate-100 text-slate-600' },
  ],
  conversionRate: 26.8,
  totalLeads: 142,
  totalBookings: 38,
  missedCallRecovery: 48.6,
};

const getTimeBasedMock = (range: string): DashboardData => {
  const base = JSON.parse(JSON.stringify(INITIAL_DASHBOARD)) as DashboardData;
  const multipliers: Record<string, number> = { 'today': 0.3, '7d': 1.0, '30d': 2.8 };
  const m = multipliers[range] || 1.0;

  base.kpis[0].value = Math.round(142 * m).toString();
  base.kpis[1].value = `${(42 + Math.random() * 12).toFixed(1)}%`;
  base.kpis[2].value = Math.round(38 * m).toString();
  base.kpis[3].value = `$${(24700 * m).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  base.totalLeads = Math.round(142 * m);
  base.totalBookings = Math.round(38 * m);

  base.pipeline = base.pipeline.map(s => ({
    ...s,
    count: Math.round(s.count * m),
    value: Math.round(s.value * m),
  }));

  return base;
};

export const dashboardService = {
  async getDashboardData(range: string = '7d'): Promise<DashboardData> {
    try {
      const response = await api.get('/dashboard', { params: { range } });
      return response.data;
    } catch {
      console.warn('API /dashboard failed, falling back to localStorage mock');
      const stored = localStorage.getItem('leadhive_dashboard');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.range === range) return parsed.data;
      }
      const data = getTimeBasedMock(range);
      localStorage.setItem('leadhive_dashboard', JSON.stringify({ range, data }));
      return data;
    }
  },
};