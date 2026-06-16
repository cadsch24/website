import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  PhoneMissed,
  MessageSquare,
  Calendar,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Shield,
  Zap
} from 'lucide-react';

export default function Landing() {
  const features = [
    {
      title: 'Instant Missed-Call Recovery',
      description: 'Automatically texts back missed callers within 30 seconds. Turn lost calls into active text conversations instantly.',
      icon: PhoneMissed,
      color: 'text-rose-500',
      bgColor: 'bg-rose-50',
    },
    {
      title: 'AI SMS Lead Qualification',
      description: 'Conversational AI greets, qualifies, and nurtures leads 24/7. Extracts job details, location, and urgency automatically.',
      icon: MessageSquare,
      color: 'text-brand-600',
      bgColor: 'bg-brand-50',
    },
    {
      title: 'Autonomous Booking',
      description: 'Integrates with Google Calendar to propose time slots and automatically book appointments straight through text.',
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
  ];

  const stats = [
    { value: '30s', label: 'Response Time' },
    { value: '45%', label: 'Lead Recovery Rate' },
    { value: '24/7', label: 'Assistant Availability' },
    { value: '3.5x', label: 'Booking Conversion' },
  ];

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* Navigation Header */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="bg-brand-500 text-white p-2 rounded-xl">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">LeadHive</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-900/30 hover:shadow-brand-500/20 transition-all duration-200"
          >
            Launch Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-full py-1.5 px-4 text-sm font-medium text-brand-400">
            <Zap className="h-4 w-4" />
            <span>Now with GPT-4o Powered Qualification</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Never Miss Another <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-400">
              Inbound Service Lead
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-xl leading-relaxed">
            The AI-powered assistant that owns the full lead-to-booking pipeline for local service businesses. Captures missed calls, follows up instantly via SMS, qualifies leads, and auto-books calendars 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/dashboard"
              className="flex items-center justify-center space-x-2 px-8 py-4 bg-brand-600 text-white text-lg font-semibold rounded-2xl hover:bg-brand-500 shadow-xl shadow-brand-900/40 hover:shadow-brand-500/30 transition-all duration-200 group"
            >
              <span>Launch Dashboard Demo</span>
              <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Hero Preview Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-40 w-40 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-semibold tracking-wide text-slate-400 uppercase">Live SMS Chat Widget</span>
              </div>
              <span className="text-xs bg-slate-800 text-brand-400 px-2.5 py-1 rounded-full font-medium">Auto-pilot</span>
            </div>

            {/* Chat Bubble 1 */}
            <div className="space-y-1 max-w-[80%]">
              <span className="text-xs text-slate-500">Lead (Roofing Estimate)</span>
              <div className="bg-slate-800 text-slate-200 p-4 rounded-2xl rounded-tl-none text-sm border border-slate-700/40">
                Hi, I missed your call. I need a leak repaired on my roof in East Austin. Can you guys help?
              </div>
            </div>

            {/* Chat Bubble 2 (AI Response) */}
            <div className="space-y-1 max-w-[80%] ml-auto text-right">
              <span className="text-xs text-brand-400 font-semibold flex items-center justify-end space-x-1">
                <Sparkles className="h-3 w-3" />
                <span>LeadHive AI</span>
              </span>
              <div className="bg-brand-600 text-white p-4 rounded-2xl rounded-tr-none text-sm text-left shadow-lg shadow-brand-900/20">
                Hi! Absolutely, we can help with leak repairs. To get you the best estimate, how soon are you looking to get this fixed, and has the leak caused any interior ceiling damage?
              </div>
            </div>

            {/* Chat Bubble 3 */}
            <div className="space-y-1 max-w-[80%]">
              <span className="text-xs text-slate-500">Lead</span>
              <div className="bg-slate-800 text-slate-200 p-4 rounded-2xl rounded-tl-none text-sm border border-slate-700/40">
                ASAP please, it's dripping. No ceiling damage yet, just a spot.
              </div>
            </div>

            {/* Chat Bubble 4 (AI Booking) */}
            <div className="space-y-1 max-w-[80%] ml-auto text-right">
              <span className="text-xs text-brand-400 font-semibold flex items-center justify-end space-x-1">
                <Sparkles className="h-3 w-3" />
                <span>LeadHive AI</span>
              </span>
              <div className="bg-brand-600 text-white p-4 rounded-2xl rounded-tr-none text-sm text-left shadow-lg shadow-brand-900/20">
                Got it. That sounds urgent. I can book an inspector to come out tomorrow morning (June 16). Would 9:00 AM or 11:30 AM work best for you?
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Divider */}
      <section className="bg-slate-800/50 border-y border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => (
            <div key={i} className="space-y-1">
              <p className="text-4xl lg:text-5xl font-extrabold text-white">{stat.value}</p>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24 lg:py-32 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl lg:text-5xl font-bold text-white tracking-tight">
            An Autonomous Front Office
          </h2>
          <p className="text-lg text-slate-400">
            LeadHive coordinates capturing, nurturing, qualifying, and booking local jobs without any human intervention required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-slate-800/40 border border-slate-800 hover:border-slate-700/80 p-8 rounded-3xl space-y-6 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`${feature.bgColor} ${feature.color} p-4 rounded-2xl inline-block shadow-inner`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust & Guarantee Section */}
      <section className="bg-gradient-to-br from-brand-900/20 to-slate-900 border-t border-slate-800 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <Sparkles className="h-12 w-12 text-brand-400 mx-auto" />
          <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Stop losing leads to the "next business on Google"
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            When local homeowners call and get a voicemail, 80% hang up and call your competitor. LeadHive ensures you text them back instantly, locking in the booking first.
          </p>
          <div className="pt-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-slate-900 text-lg font-bold rounded-2xl hover:bg-slate-100 transition-all duration-200 shadow-xl shadow-slate-950/20"
            >
              <span>Explore Dashboard Demo</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500 text-sm">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-brand-500" />
            <span className="font-bold text-lg text-slate-400 tracking-tight">LeadHive</span>
          </div>
          <p>© 2026 LeadHive Technologies Inc. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
