import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Phone,
  User,
  Clock,
  Check,
  CheckCheck,
  MoreVertical,
  Calendar,
  FileText,
  AlertTriangle
} from 'lucide-react';

export default function Conversations() {
  const [activeChatId, setActiveChatId] = useState(1);
  const [newMessage, setNewMessage] = useState('');

  const [chats, setChats] = useState([
    {
      id: 1,
      name: 'David K.',
      phone: '(512) 555-0198',
      service: 'Roofing Leak',
      lastMessage: 'Yes, 10 AM is perfect. Thank you.',
      time: '3 mins ago',
      unread: true,
      urgency: 'Hot',
      messages: [
        { id: 1, sender: 'lead', text: 'Hi, I need a leak repaired on my roof in East Austin. Can you guys help?', time: '10:23 AM' },
        { id: 2, sender: 'ai', text: 'Hi! Absolutely, we can help with leak repairs. To get you the best estimate, how soon are you looking to get this fixed, and has the leak caused any interior ceiling damage?', time: '10:24 AM' },
        { id: 3, sender: 'lead', text: 'ASAP please, it\'s dripping. No ceiling damage yet, just a spot.', time: '10:25 AM' },
        { id: 4, sender: 'ai', text: 'Got it. That sounds urgent. I can book an inspector to come out tomorrow morning (June 16). Would 10:00 AM work best for you?', time: '10:26 AM' },
        { id: 5, sender: 'lead', text: 'Yes, 10 AM is perfect. Thank you.', time: '10:27 AM' }
      ]
    },
    {
      id: 2,
      name: 'Sarah J.',
      phone: '(512) 555-0144',
      service: 'AC Warm Air',
      lastMessage: 'The vents blow but it is hot air. Yes, I have a baby...',
      time: '12 mins ago',
      unread: false,
      urgency: 'Hot',
      messages: [
        { id: 1, sender: 'lead', text: 'Hi, my air conditioner is blowing warm air. Do you have appointments today?', time: '9:12 AM' },
        { id: 2, sender: 'ai', text: 'Hello Sarah! Yes, we can definitely help. Since it is blowing warm air, are any of your vents blowing any airflow at all? Also, do you have any infants or elderly individuals in the house?', time: '9:13 AM' },
        { id: 3, sender: 'lead', text: 'The vents blow but it is hot air. Yes, I have a 18-month old baby and the house is already 82 degrees.', time: '9:14 AM' }
      ]
    },
    {
      id: 3,
      name: 'Mike L.',
      phone: '(512) 555-0121',
      service: 'HVAC replacement',
      lastMessage: 'Looking to replace my old heat pump unit. It\'s 14 yrs.',
      time: '1 hour ago',
      unread: false,
      urgency: 'Warm',
      messages: [
        { id: 1, sender: 'lead', text: 'Looking for a quote to replace my old heat pump unit. It\'s about 14 years old.', time: '4:50 PM' }
      ]
    }
  ]);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const updatedChats = chats.map(chat => {
      if (chat.id === activeChatId) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMsgObj = {
          id: chat.messages.length + 1,
          sender: 'business', // sent manually by business agent
          text: newMessage,
          time: timeStr,
          status: 'sent'
        };
        return {
          ...chat,
          lastMessage: newMessage,
          time: 'Just now',
          messages: [...chat.messages, newMsgObj]
        };
      }
      return chat;
    });

    setChats(updatedChats);
    setNewMessage('');
  };

  const handleApplyTemplate = (templateText) => {
    setNewMessage(templateText);
  };

  const templates = [
    { name: 'Ask for photos', text: 'Could you please text us 2-3 photos of the problem area? This will help our technicians review and prepare better.' },
    { name: 'Confirm Booking', text: 'All set! Your appointment is confirmed for tomorrow. Our technician will text you when they are on their way.' },
    { name: 'Send Pricing Est.', text: 'Our standard diagnostic fee is $89, which is fully applied toward any repairs we perform for you today.' }
  ];

  return (
    <div className="h-[calc(100vh-10rem)] border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm flex flex-col md:flex-row">
      {/* Sidebar - Chats List */}
      <div className="w-full md:w-80 border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
        {/* Search */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-slate-50 pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:bg-white text-xs outline-none transition-all"
            />
          </div>
        </div>

        {/* List of chats */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => {
                setActiveChatId(chat.id);
                // Mark as read
                setChats(chats.map(c => c.id === chat.id ? { ...c, unread: false } : c));
              }}
              className={`p-4 flex items-start space-x-3 cursor-pointer transition-colors ${
                chat.id === activeChatId ? 'bg-white border-l-4 border-brand-600' : 'hover:bg-slate-50'
              }`}
            >
              <div className="h-10 w-10 rounded-xl bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                {chat.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800 truncate">{chat.name}</h4>
                  <span className="text-[10px] text-slate-400">{chat.time}</span>
                </div>
                <p className="text-[11px] font-semibold text-brand-600 truncate mt-0.5">{chat.service}</p>
                <p className="text-[11px] text-slate-400 truncate mt-1">{chat.lastMessage}</p>
              </div>
              {chat.unread && (
                <div className="h-2 w-2 rounded-full bg-brand-600 flex-shrink-0 self-center" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-50">
        {/* Chat Window Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm shadow-inner">
              {activeChat.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">{activeChat.name}</h3>
              <p className="text-xs text-slate-400 flex items-center mt-0.5">
                <span className="font-mono">{activeChat.phone}</span>
                <span className="mx-1.5">•</span>
                <span className="text-brand-600 font-semibold">{activeChat.service}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Phone className="h-4 w-4" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50 flex flex-col">
          {activeChat.messages.map((msg, index) => {
            const isLead = msg.sender === 'lead';
            const isAI = msg.sender === 'ai';
            return (
              <div
                key={msg.id || index}
                className={`flex flex-col space-y-1 max-w-[70%] ${
                  isLead ? 'items-start' : 'items-end ml-auto'
                }`}
              >
                {/* Meta header */}
                <div className="flex items-center space-x-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isLead ? 'text-slate-400' : isAI ? 'text-brand-600' : 'text-slate-500'
                  }`}>
                    {isLead ? 'Lead' : isAI ? '🤖 LeadHive AI' : '👤 Business Owner'}
                  </span>
                </div>

                {/* Bubble content */}
                <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  isLead
                    ? 'bg-white text-slate-700 rounded-tl-none border border-slate-200/60 shadow-sm'
                    : isAI
                      ? 'bg-brand-600 text-white rounded-tr-none shadow-md shadow-brand-900/10'
                      : 'bg-slate-800 text-white rounded-tr-none shadow-md'
                }`}>
                  {msg.text}
                </div>

                {/* Message footer status */}
                <span className="text-[9px] text-slate-400 font-medium flex items-center">
                  {msg.time}
                  {!isLead && (
                    <span className="ml-1 text-brand-600">
                      <CheckCheck className="h-3.5 w-3.5" />
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Quick text templates */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex-shrink-0 mr-1 flex items-center">
            <Sparkles className="h-3.5 w-3.5 mr-0.5 text-brand-500" />
            <span>Templates:</span>
          </span>
          {templates.map((tmpl, i) => (
            <button
              key={i}
              onClick={() => handleApplyTemplate(tmpl.text)}
              className="text-[11px] font-semibold text-slate-600 hover:text-brand-700 hover:bg-brand-50 border border-slate-200 hover:border-brand-200 px-3 py-1.5 rounded-full flex-shrink-0 transition-colors"
            >
              {tmpl.name}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-slate-200 p-4">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <input
              type="text"
              placeholder={`Text ${activeChat.name} via SMS...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:bg-white focus:border-brand-500 transition-all"
            />
            <button
              type="submit"
              className="p-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-900/10 hover:shadow-brand-500/20 transition-all flex-shrink-0"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
