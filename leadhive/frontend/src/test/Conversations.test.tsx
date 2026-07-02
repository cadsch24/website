import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Conversations from '../pages/Conversations';

vi.mock('../services/conversationService', () => {
  const mockChats = [
    {
      id: 1,
      lead_id: 'lead-1',
      name: 'Alice Cooper',
      phone: '(512) 555-0001',
      service: 'Sink Drain Repair',
      lastMessage: 'Help with my sink',
      time: '5 mins ago',
      unread: true,
      urgency: 'Hot',
      messages: [
        { id: 1, sender: 'lead', text: 'Help with my sink', time: '10:00 AM' },
        { id: 2, sender: 'ai', text: 'We can help! Can you describe the issue?', time: '10:01 AM' }
      ]
    },
    {
      id: 2,
      lead_id: 'lead-2',
      name: 'Bob Marley',
      phone: '(512) 555-0002',
      service: 'Roof Repair',
      lastMessage: 'Need roof shingles fixed',
      time: '1 hr ago',
      unread: false,
      urgency: 'Warm',
      messages: [
        { id: 1, sender: 'lead', text: 'Need roof shingles fixed', time: '9:00 AM' }
      ]
    }
  ];

  return {
    conversationService: {
      getConversations: vi.fn().mockResolvedValue(mockChats),
      sendMessage: vi.fn().mockResolvedValue({
        id: 999,
        sender: 'business',
        text: 'Test reply',
        time: '10:30 AM',
        status: 'sent'
      }),
      markAsRead: vi.fn().mockResolvedValue(undefined),
      getTemplates: vi.fn().mockReturnValue([
        { name: 'Ask for photos', text: 'Please send photos' },
        { name: 'Confirm Booking', text: 'Your booking is confirmed' }
      ])
    }
  };
});

describe('Conversations Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the conversations sidebar and loads leads', async () => {
    render(<Conversations />);

    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search conversations/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Alice Cooper').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Bob Marley').length).toBeGreaterThanOrEqual(1);
    });
  });

  test('displays service types in sidebar', async () => {
    render(<Conversations />);

    await waitFor(() => {
      expect(screen.getAllByText('Sink Drain Repair').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Roof Repair').length).toBeGreaterThanOrEqual(1);
    });
  });

  test('opens chat thread on clicking a sidebar item', async () => {
    render(<Conversations />);

    await waitFor(() => {
      expect(screen.getAllByText('Alice Cooper').length).toBeGreaterThanOrEqual(1);
    });

    // Click Bob Marley to switch chat
    fireEvent.click(screen.getAllByText('Bob Marley')[0]);

    // The message appears in both sidebar preview + chat bubble
    await waitFor(() => {
      expect(screen.getAllByText('Need roof shingles fixed').length).toBeGreaterThanOrEqual(1);
    });
  });

  test('can type and send a new message', async () => {
    render(<Conversations />);

    await waitFor(() => {
      expect(screen.getAllByText('Alice Cooper').length).toBeGreaterThanOrEqual(1);
    });

    const input = await screen.findByPlaceholderText(/Text Alice Cooper via SMS/i);
    fireEvent.change(input, { target: { value: 'Test reply' } });

    const sendButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getAllByText('Test reply').length).toBeGreaterThanOrEqual(1);
    });
  });

  test('filters conversations by search term', async () => {
    render(<Conversations />);

    await waitFor(() => {
      expect(screen.getAllByText('Alice Cooper').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Bob Marley').length).toBeGreaterThanOrEqual(1);
    });

    const searchInput = screen.getByPlaceholderText(/Search conversations/i);
    fireEvent.change(searchInput, { target: { value: 'Bob' } });

    await waitFor(() => {
      expect(screen.getAllByText('Bob Marley').length).toBeGreaterThanOrEqual(1);
    });
  });
});