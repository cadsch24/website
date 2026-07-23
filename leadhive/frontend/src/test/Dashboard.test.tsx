import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../pages/Dashboard';

vi.mock('../services/dashboardService', () => {
  const mockData = {
    kpis: [
      { name: 'Leads Captured', value: '142', change: '+18.2%', isPositive: true, timeframe: 'vs last week', icon: 'Users', color: 'text-brand-600', bgColor: 'bg-brand-50 border-brand-100' },
      { name: 'Recovery Rate', value: '48.6%', change: '+4.3%', isPositive: true, timeframe: 'vs last week', icon: 'PhoneMissed', color: 'text-rose-600', bgColor: 'bg-rose-50 border-rose-100' },
      { name: 'Appts Booked', value: '38', change: '+12.5%', isPositive: true, timeframe: 'vs last week', icon: 'Calendar', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-100' },
      { name: 'Est. Revenue', value: '$24,700', change: '+22.1%', isPositive: true, timeframe: 'vs last week', icon: 'TrendingUp', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-100' },
    ],
    pipeline: [
      { name: 'New Leads', count: 48, value: 48000, color: 'bg-blue-500' },
      { name: 'Contacted', count: 32, value: 42000, color: 'bg-amber-500' },
      { name: 'Qualified', count: 24, value: 54000, color: 'bg-indigo-500' },
      { name: 'Booked', count: 18, value: 38000, color: 'bg-brand-500' },
      { name: 'Lost', count: 12, value: 15000, color: 'bg-rose-400' },
    ],
    recentActivity: [
      { id: 1, type: 'missed_call', title: 'Missed Call Recovered', description: 'Auto-text sent', time: '3 mins ago', tag: 'Hot Lead', tagColor: 'bg-rose-100 text-rose-800' },
      { id: 2, type: 'booking', title: 'Appointment Confirmed', description: 'Booked inspection', time: '24 mins ago', tag: 'Booked', tagColor: 'bg-brand-100 text-brand-800' },
    ],
    conversionRate: 26.8,
    totalLeads: 142,
    totalBookings: 38,
    missedCallRecovery: 48.6,
  };

  return {
    dashboardService: {
      getDashboardData: vi.fn().mockResolvedValue(mockData),
    },
  };
});

describe('Dashboard Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders welcome banner', async () => {
    render(<Dashboard />);
    expect(await screen.findByText(/Welcome back/)).toBeInTheDocument();
  });

  test('renders time range filter buttons', async () => {
    render(<Dashboard />);
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('7 Days')).toBeInTheDocument();
    expect(screen.getByText('30 Days')).toBeInTheDocument();
  });

  test('renders KPI cards after loading', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Leads Captured')).toBeInTheDocument();
      expect(screen.getByText('Recovery Rate')).toBeInTheDocument();
      expect(screen.getByText('Appts Booked')).toBeInTheDocument();
      expect(screen.getByText('Est. Revenue')).toBeInTheDocument();
    });
  });

  test('renders pipeline section', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Revenue Pipeline')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('New Leads')).toBeInTheDocument();
      expect(screen.getByText('Contacted')).toBeInTheDocument();
      expect(screen.getByText('Qualified')).toBeInTheDocument();
    });
  });

  test('renders conversion rate and missed call recovery', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('26.8%')).toBeInTheDocument();
    });
    const recoveryElements = screen.getAllByText('48.6%');
    expect(recoveryElements.length).toBeGreaterThanOrEqual(1);
  });

  test('renders recent activity feed', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Missed Call Recovered')).toBeInTheDocument();
      expect(screen.getByText('Appointment Confirmed')).toBeInTheDocument();
    });
  });
});