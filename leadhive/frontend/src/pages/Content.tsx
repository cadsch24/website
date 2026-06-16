import React, { useState } from 'react';
import {
  Sparkles,
  Facebook,
  Instagram,
  FileText,
  Calendar,
  Send,
  Plus,
  RefreshCw,
  Edit3,
  ThumbsUp,
  MessageCircle,
  Share2,
  Globe
} from 'lucide-react';

export default function Content() {
  const [activePlatform, setActivePlatform] = useState('instagram');
  const [ideas, setIdeas] = useState([
    {
      id: 1,
      topic: 'Preventing Roof Leaks before the Storm',
      platform: 'instagram',
      hook: '🚨 Homeowners: Is your roof ready for the heavy Texas storms this week? 🌧️',
      caption: 'A small dripping spot on your ceiling today can turn into a full ceiling collapse tomorrow. Don\'t wait for the storm to tell you your roof has a leak. Inspecting your shingles, flashing, and gutters today saves thousands in structural wood damage later.\n\nWe provide 100% free, zero-obligation roof inspections across Austin!',
      cta: '👉 Text us "INSPECT" to (512) 555-0198 to secure a slot tomorrow morning!',
      hashtags: '#AustinRoofing #HomeMaintenance #AustinLocalBusiness #StormPrep',
      status: 'Draft',
      image: 'https://images.unsplash.com/photo-1632759190569-b57048152213?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 2,
      topic: 'Why regular AC maintenance is critical',
      platform: 'facebook',
      hook: 'Why is your AC blowing warm air in 95° weather? 🥵',
      caption: 'Most air conditioning failures aren\'t sudden disasters — they are caused by simple, preventable issues like dirty coils, clogged drain lines, or low refrigerant levels. Getting your annual system tune-up extends your system life by up to 5 years and slashes your utility bills by 15%!\n\nGet diagnostic inspections scheduled straight through text!',
      cta: '📲 Send a quick text to (512) 555-0198 to schedule an inspection.',
      hashtags: '#AustinHVAC #ACMaintenance #SaveOnEnergy #LocalHVAC',
      status: 'Draft',
      image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7eed?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 3,
      topic: 'Standard diagnostic service announcement',
      platform: 'google',
      hook: 'Professional Drain Unclogging Services in Austin 🛠️',
      caption: 'Main line drain back-ups can ruin your evening. Our team provides fast, professional sewer line clearings using advanced mechanical snakes and camera locator scopes. No hidden fees. Standard diagnostic starts at just $89 which applies entirely toward any repair services we perform.',
      cta: '📞 Text "DRAIN" to (512) 555-0198 to get an emergency plumber dispatched now.',
      hashtags: '',
      status: 'Scheduled',
      image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&auto=format&fit=crop&q=60'
    }
  ]);

  const activeIdeas = ideas.filter(idea => idea.platform === activePlatform);

  const handleGenerateIdeas = () => {
    alert('AI Content Ideation Engine triggered! Generating 3 new weekly social media ideas for Austin local market...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Social Content Generator</h2>
          <p className="text-sm text-slate-500 mt-1">Generate weekly, highly local-targeted copywriting ideas using GPT-4o conversational model.</p>
        </div>
        <button
          onClick={handleGenerateIdeas}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-900/10 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-1 animate-spin-hover" />
          <span>Generate New Social Ideas</span>
        </button>
      </div>

      {/* Main Grid: Content Editor + Mock Social Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Ideas copy block list */}
        <div className="lg:col-span-7 space-y-6">
          {/* Platform Tabs */}
          <div className="flex border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActivePlatform('instagram')}
              className={`pb-3 pr-6 flex items-center space-x-2 ${
                activePlatform === 'instagram'
                  ? 'border-b-2 border-brand-600 text-brand-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Instagram className="h-4 w-4" />
              <span>Instagram</span>
            </button>
            <button
              onClick={() => setActivePlatform('facebook')}
              className={`pb-3 px-6 flex items-center space-x-2 ${
                activePlatform === 'facebook'
                  ? 'border-b-2 border-brand-600 text-brand-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Facebook className="h-4 w-4" />
              <span>Facebook</span>
            </button>
            <button
              onClick={() => setActivePlatform('google')}
              className={`pb-3 px-6 flex items-center space-x-2 ${
                activePlatform === 'google'
                  ? 'border-b-2 border-brand-600 text-brand-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Globe className="h-4 w-4" />
              <span>Google Profile</span>
            </button>
          </div>

          {/* Cards Stack */}
          <div className="space-y-6">
            {activeIdeas.length > 0 ? (
              activeIdeas.map((idea) => (
                <div key={idea.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Generated Campaign Topic</span>
                      <h3 className="font-extrabold text-sm text-slate-800">{idea.topic}</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      idea.status === 'Scheduled' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {idea.status}
                    </span>
                  </div>

                  {/* Copywriting parts */}
                  <div className="space-y-3 text-xs leading-relaxed">
                    <div className="space-y-1 bg-slate-50 border border-slate-100/80 rounded-xl p-3">
                      <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block">Visual Hook / Head</span>
                      <p className="font-bold text-slate-800">{idea.hook}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Body Caption Copy</span>
                      <p className="text-slate-600 whitespace-pre-line">{idea.caption}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Call To Action (CTA)</span>
                      <p className="font-bold text-brand-700">{idea.cta}</p>
                    </div>

                    {idea.hashtags && (
                      <div className="text-[11px] font-mono font-semibold text-slate-400 pt-1">
                        {idea.hashtags}
                      </div>
                    )}
                  </div>

                  {/* Footer actions */}
                  <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
                    <button className="inline-flex items-center space-x-1.5 px-3 py-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-lg font-semibold transition-colors">
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Copy</span>
                    </button>
                    <div className="flex items-center gap-3">
                      <button className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors">
                        Schedule Post
                      </button>
                      <button className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all shadow-md shadow-brand-900/10">
                        Publish Now
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center text-slate-400 font-medium">
                No campaign ideas active for this platform.
              </div>
            )}
          </div>
        </div>

        {/* Live device preview on the right */}
        {activeIdeas.length > 0 && (
          <div className="lg:col-span-5 space-y-4 sticky top-20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Social Live Preview</h4>

            {activePlatform === 'instagram' && (
              <div className="bg-white border border-slate-200 rounded-3xl max-w-sm mx-auto overflow-hidden shadow-md text-xs">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <div className="h-7 w-7 rounded-full bg-slate-900 flex items-center justify-center text-white font-extrabold text-[10px]">AS</div>
                    <div>
                      <p className="font-extrabold text-slate-800">acme_services</p>
                      <p className="text-[9px] text-slate-400">Austin, Texas</p>
                    </div>
                  </div>
                  <MoreVertical className="h-4 w-4 text-slate-400" />
                </div>

                {/* Mock Image */}
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  <img
                    src={activeIdeas[0].image}
                    alt="Social campaign"
                    className="object-cover w-full h-full"
                  />
                </div>

                {/* Engagement Actions */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-3 text-slate-700">
                      <ThumbsUp className="h-5 w-5 hover:text-brand-600 cursor-pointer" />
                      <MessageCircle className="h-5 w-5" />
                      <Share2 className="h-5 w-5" />
                    </div>
                  </div>
                  {/* Likes */}
                  <p className="font-bold text-slate-800">Liked by 24 homeowners</p>
                  {/* Caption */}
                  <p className="text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-800 mr-1.5">acme_services</span>
                    <span className="font-bold text-slate-800">{activeIdeas[0].hook}</span>{' '}
                    {activeIdeas[0].caption.slice(0, 100)}... <span className="text-slate-400 cursor-pointer font-semibold">more</span>
                  </p>
                </div>
              </div>
            )}

            {activePlatform === 'facebook' && (
              <div className="bg-white border border-slate-200 rounded-2xl max-w-sm mx-auto p-4 shadow-md text-xs space-y-3">
                {/* Header */}
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs">AS</div>
                  <div>
                    <h5 className="font-extrabold text-slate-800">Acme Services</h5>
                    <p className="text-[9px] text-slate-400">Sponsored • Austin, TX</p>
                  </div>
                </div>

                {/* Text */}
                <p className="text-slate-600 leading-relaxed font-sans">
                  <span className="font-bold text-slate-800 block mb-1">{activeIdeas[0].hook}</span>
                  {activeIdeas[0].caption}
                </p>

                {/* Image */}
                <div className="aspect-[1.91/1] bg-slate-100 rounded-xl overflow-hidden">
                  <img
                    src={activeIdeas[0].image}
                    alt="Facebook campaign"
                    className="object-cover w-full h-full"
                  />
                </div>

                {/* Call to action card */}
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold">LEADHIVE.AI</span>
                    <p className="font-bold text-slate-800">Get Diagnostic Estimations via Text</p>
                  </div>
                  <button className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg font-bold">
                    Text Now
                  </button>
                </div>
              </div>
            )}

            {activePlatform === 'google' && (
              <div className="bg-white border border-slate-200 rounded-2xl max-w-sm mx-auto p-4 shadow-md text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">Google Maps Post</span>
                </div>
                {/* Image */}
                <div className="aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden">
                  <img
                    src={activeIdeas[0].image}
                    alt="Google campaign"
                    className="object-cover w-full h-full"
                  />
                </div>
                {/* Text */}
                <h5 className="font-extrabold text-slate-800">{activeIdeas[0].hook}</h5>
                <p className="text-slate-500 leading-relaxed">{activeIdeas[0].caption}</p>
                {/* CTA */}
                <p className="font-bold text-brand-600">{activeIdeas[0].cta}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
