import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Phone,
  CheckCheck,
  MoreVertical,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { conversationService, ChatThread, ChatMessage } from '../services/conversationService';

export default function Conversations() {
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);
  const [apiError, setApiError] = useState(false);

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  // Shared load function used by both initial load and manual refresh
  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await conversationService.getConversations();
      setChats(data);
      setApiError(false);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Auto-select first chat on initial load only
  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      setActiveChatId(chats[0].id);
    }
  }, [chats.length > 0]);

  // Poll for new messages every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      conversationService.getConversations().then(data => {
        setChats(prev => {
          // Merge new data while preserving the active chat's messages
          return data.map(newChat => {
            const existing = prev.find(c => c.id === newChat.id);
            return existing ? { ...newChat, messages: existing.messages } : newChat;
          });
        });
      }).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectChat = async (chatId: number) => {
    setActiveChatId(chatId);
    // Mark as read
    setChats(prev => prev.map(c => 
      c.id === chatId ? { ...c, unread: false } : c
    ));
    await conversationService.markAsRead(chatId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || sending) return;

    const body = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const newMsg = await conversationService.sendMessage(activeChat.lead_id, body);
      
      // Optimistically update the UI
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChat.id) {
          return {
            ...chat,
            lastMessage: body,
            time: 'Just now',
            messages: [...chat.messages, newMsg]
          };
        }
        return chat;
      }));
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleApplyTemplate = (templateText: string) => {
    setNewMessage(templateText);
  };

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

  const filteredChats = chats.filter(chat => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      chat.name.toLowerCase().includes(q) ||
      chat.phone.includes(q) ||
      chat.service.toLowerCase().includes(q) ||
      chat.lastMessage.toLowerCase().includes(q)
    );
  });

  const templates = conversationService.getTemplates();

  return (
    <div className="h-[calc(100vh-10rem)] border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm flex flex-col md:flex-row">
      {/* Sidebar - Chats List */}
      <div className="w-full md:w-80 border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
        {/* Header + Search */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-brand-600" />
              Messages
            </h3>
            <button
              onClick={loadConversations}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:bg-white text-xs outline-none transition-all"
            />
          </div>
        </div>

        {/* List of chats */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loading && chats.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-brand-500 mb-2" />
              <p className="text-xs font-medium">Loading conversations...</p>
            </div>
          ) : filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`p-4 flex items-start space-x-3 cursor-pointer transition-colors ${
                  chat.id === activeChatId
                    ? 'bg-white border-l-4 border-brand-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="h-10 w-10 rounded-xl bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                  {chat.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-800 truncate flex items-center gap-1.5">
                      {chat.name}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getUrgencyBadge(chat.urgency)}`}>
                        {chat.urgency}
                      </span>
                    </h4>
                    <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">{chat.time}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-brand-600 truncate mt-0.5">{chat.service}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-1">{chat.lastMessage}</p>
                </div>
                {chat.unread && (
                  <div className="h-2 w-2 rounded-full bg-brand-600 flex-shrink-0 self-center" />
                )}
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-slate-400">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium">
                {searchTerm ? 'No conversations match your search.' : 'No conversations yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-50">
        {activeChat ? (
          <>
            {/* Chat Window Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm shadow-inner">
                  {activeChat.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-800">{activeChat.name}</h3>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${getUrgencyBadge(activeChat.urgency)}`}>
                      {activeChat.urgency}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center mt-0.5">
                    <span className="font-mono">{activeChat.phone}</span>
                    <span className="mx-1.5">•</span>
                    <span className="text-brand-600 font-semibold">{activeChat.service}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Call lead" aria-label="Call lead">
                  <Phone className="h-4 w-4" />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="More options" aria-label="More options">
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
                  disabled={sending}
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={!newMessage.trim() || sending}
                  className="p-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-900/10 hover:shadow-brand-500/20 transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className={`h-4.5 w-4.5 ${sending ? 'animate-pulse' : ''}`} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-slate-500">Select a conversation to view messages</p>
              <p className="text-xs mt-1">Choose a lead from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}