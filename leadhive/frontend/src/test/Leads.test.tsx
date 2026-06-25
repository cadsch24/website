import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Leads from '../pages/Leads';

// Mock the leadService to isolate component testing
vi.mock('../services/leadService', () => {
  const mockLeads = [
    {
      id: 'mock-1',
      business_id: 'biz-1',
      name: 'Alice Cooper',
      phone: '(512) 555-0001',
      location: 'Austin, TX',
      job_type: 'Sink Drain Repair',
      urgency: 'Hot',
      status: 'new',
      budget_range: '$300',
      tag: 'hot',
      ai_summary: 'Alice reported a completely clogged kitchen sink.',
      created_at: '2026-06-15T10:00:00Z',
      updated_at: '2026-06-15T10:00:00Z',
      conversations: [
        { id: 'm1', lead_id: 'mock-1', business_id: 'biz-1', channel: 'sms', direction: 'inbound', content: 'Help with my sink', created_at: '2026-06-15T10:00:00Z' }
      ],
      bookings: []
    },
    {
      id: 'mock-2',
      business_id: 'biz-1',
      name: 'Bob Marley',
      phone: '(512) 555-0002',
      location: 'Jamaica, TX',
      job_type: 'Roof Shingle Repair',
      urgency: 'Warm',
      status: 'contacted',
      budget_range: '$2,500',
      tag: 'warm',
      ai_summary: 'Bob Marley wants to fix roof shingles blown off by wind.',
      created_at: '2026-06-15T11:00:00Z',
      updated_at: '2026-06-15T11:00:00Z',
      conversations: [],
      bookings: []
    }
  ];

  return {
    leadService: {
      getLeads: vi.fn().mockResolvedValue(mockLeads),
      getLeadById: vi.fn().mockImplementation((id) => Promise.resolve(mockLeads.find(l => l.id === id))),
      updateLeadStatus: vi.fn().mockImplementation((id, status) => {
        const lead = mockLeads.find(l => l.id === id);
        if (lead) lead.status = status;
        return Promise.resolve(lead);
      }),
      sendSMS: vi.fn().mockResolvedValue({
        id: 'new-msg',
        lead_id: 'mock-1',
        business_id: 'biz-1',
        channel: 'sms',
        direction: 'outbound',
        content: 'Mocked reply',
        created_at: new Date().toISOString()
      }),
      bookAppointment: vi.fn().mockResolvedValue({
        id: 'new-booking',
        lead_id: 'mock-1',
        business_id: 'biz-1',
        scheduled_at: '2026-06-16T10:00:00Z',
        status: 'confirmed',
        service_type: 'Sink Drain Repair',
        notes: '',
        reminders_sent: 0,
        created_at: new Date().toISOString()
      })
    }
  };
});

describe('Leads CRM Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the Leads page header and table layout', async () => {
    render(<Leads />);
    
    // Check main headers (rendered immediately, not in table)
    expect(screen.getByText('Lead CRM Pipeline')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search leads by name/i)).toBeInTheDocument();

    // Check columns exist (table only renders after async data loads)
    await waitFor(() => {
      expect(screen.getByText('Customer Name')).toBeInTheDocument();
      expect(screen.getByText('Job / Request Type')).toBeInTheDocument();
    });
  });

  test('displays retrieved leads in the list view', async () => {
    render(<Leads />);

    // Wait for the mock leads to load
    await waitFor(() => {
      expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
      expect(screen.getByText('Bob Marley')).toBeInTheDocument();
    });

    // Check service type columns
    expect(screen.getByText('Sink Drain Repair')).toBeInTheDocument();
    expect(screen.getByText('Roof Shingle Repair')).toBeInTheDocument();
  });

  test('opens detailed sidebar drawer on clicking a lead row', async () => {
    render(<Leads />);

    // Wait for the mock leads to load
    await waitFor(() => {
      expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
    });

    // Click on Alice Cooper's row
    const row = screen.getByText('Alice Cooper').closest('tr');
    expect(row).not.toBeNull();
    fireEvent.click(row!);

    // Sidebar should open with details
    expect(screen.getByText('AI Qualification Summary')).toBeInTheDocument();
    expect(screen.getByText('Alice reported a completely clogged kitchen sink.')).toBeInTheDocument();
    expect(screen.getByText('Help with my sink')).toBeInTheDocument();
  });
});



