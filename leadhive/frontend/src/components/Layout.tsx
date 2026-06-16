import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  Sparkles,
  Menu,
  X,
  Bell,
  Settings,
  HelpCircle
} from 'lucide-react';

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads CRM', href: '/leads', icon: Users },
    { name: 'Conversations', href: '/conversations', icon: MessageSquare },
    { name: 'Bookings', href: '/bookings', icon: Calendar },
    { name: 'Content AI', href: '/content', icon: Sparkles },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="bg-brand-600 text-white p-1.5 rounded-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">LeadHive</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md focus:outline-none"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform md:translate-x-0 md:static md:flex md:flex-col
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Sidebar Brand Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-500 text-white p-2 rounded-xl">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">LeadHive</span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                  ${active
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-900/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center space-x-3 px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer">
            <Settings className="h-5 w-5" />
            <span className="font-medium">Settings</span>
          </div>
          <div className="flex items-center space-x-3 px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer">
            <HelpCircle className="h-5 w-5" />
            <span className="font-medium">Support</span>
          </div>
          <div className="pt-4 flex items-center space-x-3 px-4 border-t border-slate-800">
            <div className="h-9 w-9 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold">
              LH
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">Acme Services</p>
              <p className="text-xs text-slate-500 truncate">acme@leadhive.ai</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Top Header */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 px-8 items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-slate-800">
              {navigation.find((item) => isActive(item.href))?.name || 'LeadHive'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-sm">
                AS
              </div>
              <span className="text-sm font-medium text-slate-700">Acme Services</span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
