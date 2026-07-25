import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Bookings from '../pages/Bookings';

vi.mock('../services/bookingService', () => {
  const mockBookings = [
    { id: 'B-201', leadName: 'David K.', phone: '(512) 555-0198', serviceType: 'Roofing Leak Repair', scheduledAt: 'June 16, 2026', timeSlot: '10:00 AM - 12:00 PM', location: 'East Austin, TX', status: 'Confirmed', remindersSent: true, notes: 'Emergency inspection.' },
    { id: 'B-202', leadName: 'Sarah J.', phone: '(512) 555-0144', serviceType: 'AC Diagnostics', scheduledAt: 'June 16, 2026', timeSlot: '01:30 PM - 03:00 PM', location: 'West Lake Hills, TX', status: 'Pending', remindersSent: false, notes: 'AC blowing warm air.' },
    { id: 'B-203', leadName: 'Robert P.', phone: '(512) 555-0177', serviceType: 'Plumbing Service', scheduledAt: 'June 15, 2026', timeSlot: '04:00 PM - 05:30 PM', location: 'Pflugerville, TX', status: 'Completed', remindersSent: true, notes: 'Shower drain backup.' },
  ];

  return {
    bookingService: {
      getBookings: vi.fn().mockResolvedValue(mockBookings),
      proposeSlots: vi.fn().mockResolvedValue(undefined),
      updateBookingStatus: vi.fn().mockResolvedValue(mockBookings[0]),
      toggleReminders: vi.fn().mockResolvedValue({ ...mockBookings[0], remindersSent: false }),
    },
  };
});

describe('Bookings Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the bookings page header', async () => {
    render(<Bookings />);
    expect(screen.getByText('Calendar Bookings')).toBeInTheDocument();
  });

  test('renders tabs for Upcoming and Completed', async () => {
    render(<Bookings />);
    expect(screen.getByText(/Upcoming/)).toBeInTheDocument();
    expect(screen.getByText(/Completed/)).toBeInTheDocument();
  });

  test('displays booking cards after loading', async () => {
    render(<Bookings />);
    await waitFor(() => {
      expect(screen.getByText('David K.')).toBeInTheDocument();
      expect(screen.getByText('Sarah J.')).toBeInTheDocument();
    });
    // Robert P. is completed, should not show in upcoming tab
    expect(screen.queryByText('Robert P.')).not.toBeInTheDocument();
  });

  test('filters correctly: upcoming shows Confirmed and Pending', async () => {
    render(<Bookings />);
    await waitFor(() => {
      expect(screen.getByText('David K.')).toBeInTheDocument();
      expect(screen.getByText('Sarah J.')).toBeInTheDocument();
    });
    // Confirm counter
    expect(screen.getByText(/Upcoming \(2\)/)).toBeInTheDocument();
  });

  test('shows Completed bookings when tab is switched', async () => {
    render(<Bookings />);
    await waitFor(() => {
      expect(screen.getByText('David K.')).toBeInTheDocument();
    });

    // Click Completed tab
    fireEvent.click(screen.getByText(/Completed/));
    await waitFor(() => {
      expect(screen.getByText('Robert P.')).toBeInTheDocument();
    });
  });

  test('has Propose Time Slots button', async () => {
    render(<Bookings />);
    expect(screen.getByText('Propose Time Slots via SMS')).toBeInTheDocument();
  });
});