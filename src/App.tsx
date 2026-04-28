import React, { useState, useEffect, useRef } from 'react';
import { rakshakSentry, SentryResult } from './gemini';

interface Alert extends SentryResult {
  id: string; timeToOrchestrationMs: number; 
  timestamp: string; lat: number; lng: number; isResolved?: boolean;
}

type ViewState = 'portal' | 'dashboard' | 'map' | 'medical' | 'chat' | 'surveillance';

declare const L: any;

function TacticalMap({ center, infra, onSelect, activeTarget, isMini = false, filter = 'none' }: any) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, { zoomControl: false, attributionControl: false, dragging: !isMini, scrollWheelZoom: !isMini }).setView([center.lat, center.lng], isMini ? 12 : 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
    }
    if (mapInstance.current) {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = infra.map((item: any) => {
        const color = item.type === 'hospital' || item.type === 'pharmacy' ? '#3B82F6' : '#EF4444';
        const m = L.circleMarker([item.lat, item.lng], { radius: isMini ? 4 : 7, fillColor: color, color: '#FFF', weight: 1, opacity: 1, fillOpacity: 0.9 }).addTo(mapInstance.current);
        if (onSelect) m.on('click', (e: any) => { L.DomEvent.stopPropagation(e); onSelect(item); });
        return m;
      });
      if (activeTarget && !isMini) mapInstance.current.flyTo([activeTarget.lat, activeTarget.lng], 16);
    }
  }, [infra, center, isMini, activeTarget, onSelect]);

  const filterStyle = filter === 'thermal' ? 'grayscale(1) invert(1) sepia(1) hue-rotate(200deg) saturate(3)' : 'none';
  return <div ref={mapRef} className="w-full h-full transition-all duration-700" style={{ filter: filterStyle }} />;
}

function App() {
  const [view, setView] = useState<ViewState>('portal');
  const [report, setReport] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: '1', category: 'SYSTEM', summary: 'RAKSHAK ZENITH ONLINE', instruction: 'Neural engine established. GPS link active.', priority: 1, timestamp: '10:05 PM', lat: 18.107, lng: 83.382, timeToOrchestrationMs: 0 }
  ]);
  const [coords, setCoords] = useState({ lat: 18.107, lng: 83.382 });
  const [infrastructure, setInfrastructure] = useState<any[]>([]);
  const [activeRoute, setActiveRoute] = useState<any>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [isSosActive, setIsSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(10);
  const [sosSent, setSosSent] = useState(false);
  const [activeMedical, setActiveMedical] = useState<string | null>(null);
  const [vitals, setVitals] = useState({ hr: '', temp: '' });
  const [droneRequested, setDroneRequested] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([{ role: 'ai', text: 'Neural Link established. Monitoring sector for anomalies. How can I assist?' }]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    let timer: any;
    if (isSosActive && sosCountdown > 0 && !sosSent) {
      timer = setInterval(() => setSosCountdown(c => +(c - 0.1).toFixed(1)), 100);
    } else if (sosCountdown <= 0 && !sosSent) {
      setSosSent(true);
    }
    return () => clearInterval(timer);
  }, [isSosActive, sosCountdown, sosSent]);

  const fetchPOIs = async (lat: number, lng: number) => {
    const query = `[out:json];(node["amenity"~"hospital|police|fire_station|pharmacy|bank"](around:1000,${lat},${lng}););out body;`;
    try {
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await res.json();
      setInfrastructure(data.elements.map((e: any) => ({
        name: e.tags.name || `${e.tags.amenity} Unit`,
        type: e.tags.amenity,
        lat: e.lat, lng: e.lon
      })));
    } catch (e) {}
  };

  const fetchRoute = async (target: any) => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords.lng},${coords.lat};${target.lng},${target.lat}?overview=full`);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const r = data.routes[0];
        setRouteData({ distance: (r.distance / 1000).toFixed(2), duration: (r.duration / 60).toFixed(1) });
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        fetchPOIs(c.lat, c.lng);
      });
    }
  }, []);

  useEffect(() => {
    if (activeRoute) fetchRoute(activeRoute);
    else setRouteData(null);
  }, [activeRoute]);

  const medicalData = [
    { id: 'cpr', title: 'CPR NEURAL LINK', level: 'CRITICAL', hasPulse: true, kit: ['AED', 'Face Shield', 'Gloves'], steps: ['Locate center of chest.', 'Push 2 inches deep.', 'Match the 110BPM pulse.'] },
    { id: 'bleed', title: 'TRAUMA: BLEED', level: 'URGENT', hasPulse: false, kit: ['Tourniquet', 'Pressure Bandage', 'QuikClot'], steps: ['Apply direct pressure.', 'Pack with sterile gauze.', 'Use tourniquet if distal.'] },
    { id: 'choke', title: 'HEIMLICH MANEUVER', level: 'URGENT', hasPulse: false, kit: ['Suction Device', 'Towel'], steps: ['Stand behind patient.', 'Place fist above navel.', 'Perform inward/upward thrusts.'] },
    { id: 'seize', title: 'SEIZURE RESPONSE', level: 'URGENT', hasPulse: false, kit: ['Pillow', 'Timer'], steps: ['Clear surrounding objects.', 'Place something soft under head.', 'Time the duration.'] },
    { id: 'burn', title: 'THERMAL RELIEF', level: 'TACTICAL', hasPulse: false, kit: ['Saline', 'Burn Sheet', 'Wrap'], steps: ['Cool burn with water.', 'Remove jewelry.', 'Cover loosely with wrap.'] },
    { id: 'allergy', title: 'ANAPHYLAXIS', level: 'CRITICAL', hasPulse: false, kit: ['Epi-Pen', 'Antihistamine'], steps: ['Administer Epi-Pen.', 'Keep patient lying flat.', 'Monitor breathing.'] }
  ];

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!report.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await rakshakSentry({ message: report, silentMode: false, hasVisual: false, hasAudio: false, vitals: null, drone: false });
      setAlerts(prev => [{ id: `${Date.now()}`, ...res, timeToOrchestrationMs: 0, timestamp: new Date().toLocaleTimeString(), lat: coords.lat, lng: coords.lng }, ...prev]);
      setView('dashboard');
    } catch (err) {}
    finally { setReport(''); setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-black text-[#F5F5F7] font-sans selection:bg-red-600">
      <nav className="fixed top-0 left-0 w-full bg-black/80 backdrop-blur-3xl p-6 border-b border-white/5 flex justify-between items-center z-50">
        <div className="flex items-center gap-3"><span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-black font-black text-[10px]">S</span><span className="text-2xl font-black tracking-tighter uppercase italic">Rakshak <span className="text-red-600">Zenith</span></span></div>
        <div className="flex gap-6 items-center uppercase text-[10px] font-black tracking-widest transition-all">
          {['portal', 'dashboard', 'map', 'medical', 'chat', 'surveillance'].map(v => (
            <button key={v} onClick={() => setView(v as ViewState)} className={view === v ? 'text-white border-b-2 border-red-600 pb-1' : 'text-white/20 hover:text-white/50'}>{v}</button>
          ))}
          <button onClick={() => { setIsSosActive(true); setSosCountdown(10); setSosSent(false); }} className="bg-red-600 text-white px-6 py-2 rounded-full font-black ml-4 shadow-[0_0_30px_rgba(220,38,38,0.4)]">SOS</button>
        </div>
      </nav>

      <main className="pt-40 px-10 max-w-[1400px] mx-auto pb-48">
        {isSosActive && (
          <div className="fixed inset-0 bg-red-600 z-[1000] flex flex-col items-center justify-center p-10 text-center text-white">
            {!sosSent ? (
              <><h1 className="text-[12rem] font-black italic leading-none">{sosCountdown.toFixed(1)}</h1><button onClick={() => setIsSosActive(false)} className="bg-white text-black px-16 py-6 rounded-full font-black uppercase text-xl">ABORT</button></>
            ) : (
              <div className="animate-blur-in"><h1 className="text-7xl font-black italic uppercase leading-none mb-6">SIGNAL SENT</h1><button onClick={() => setIsSosActive(false)} className="bg-white/10 border border-white/20 text-white px-16 py-6 rounded-full font-black uppercase text-xl mt-10">CLOSE</button></div>
            )}
          </div>
        )}

        {view === 'portal' ? (
          <div className="max-w-4xl mx-auto py-10 animate-blur-in text-center">
            <h1 className="text-9xl font-black mb-16 tracking-tighter italic uppercase leading-[0.8]">Protect.<br /><span className="text-white/10">Now.</span></h1>
            <form onSubmit={handleSubmit} className="bg-[#0A0A0A] p-16 rounded-[4rem] border border-white/5 shadow-2xl">
              <textarea value={report} onChange={e => setReport(e.target.value)} placeholder="State the emergency..." className="w-full h-40 bg-transparent text-4xl font-bold tracking-tighter text-white outline-none resize-none mb-10 placeholder-[#222]" />
              <button type="submit" disabled={isSubmitting} className="bg-white text-black px-16 py-6 rounded-[2.5rem] font-black text-2xl uppercase">Launch Sentry</button>
            </form>
          </div>
        ) : view === 'dashboard' ? (
          <div className="animate-blur-in grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-8 space-y-8">
                <div className="bg-[#0A0A0A] p-12 rounded-[4rem] border border-white/5">
                   <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-10 border-b border-white/5 pb-6">Active Intelligence</h2>
                   <div className="space-y-6">{alerts.map(a => (<div key={a.id} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex justify-between items-center"><div><span className="text-[9px] font-black text-red-600 uppercase tracking-widest block mb-2">{a.category}</span><h3 className="text-2xl font-black italic uppercase text-white">{a.summary}</h3></div><div className={`px-6 py-2 rounded-full text-[10px] font-black ${a.priority >= 4 ? 'bg-red-600 text-white' : 'bg-white text-black'}`}>P{a.priority}</div></div>))}</div>
                </div>
             </div>
             <div className="lg:col-span-4 space-y-8">
                <div className="bg-[#0A0A0A] p-10 rounded-[3.5rem] border border-white/5">
                   <span className="text-[9px] font-black text-white/20 uppercase block mb-6 tracking-widest text-center">Sector Readiness</span>
                   <div className="relative w-40 h-40 mx-auto flex items-center justify-center"><div className="absolute inset-0 rounded-full border-4 border-white/5" /><div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin-slow" /><span className="text-5xl font-black italic">98%</span></div>
                </div>
                <div className="h-64 bg-[#0A0A0A] rounded-[3.5rem] border border-white/5 overflow-hidden"><TacticalMap center={coords} infra={infrastructure} activeTarget={null} isMini={true} /></div>
             </div>
          </div>
        ) : view === 'map' ? (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[80vh] animate-blur-in">
              <div className="lg:col-span-8 bg-[#0A0A0A] rounded-[4rem] border border-white/5 relative overflow-hidden">
                 <TacticalMap center={coords} infra={infrastructure} activeTarget={activeRoute} onSelect={setActiveRoute} />
                 {activeRoute && routeData && (
                   <div className="absolute top-10 left-10 right-10 bg-white text-black p-8 rounded-[2.5rem] shadow-2xl flex justify-between items-center z-[1000] animate-slide-up border-4 border-red-600">
                      <div><span className="text-[10px] font-black uppercase tracking-widest opacity-40 block">ETA TO {activeRoute.name}</span><h2 className="text-4xl font-black italic uppercase tracking-tighter">{routeData.duration} MIN</h2></div>
                      <button onClick={() => setActiveRoute(null)} className="text-4xl font-thin ml-6 hover:text-red-600 transition-colors">×</button>
                   </div>
                 )}
              </div>
              <aside className="lg:col-span-4 bg-[#0A0A0A] rounded-[3.5rem] border border-white/5 p-8 flex flex-col overflow-hidden shadow-2xl">
                 <h3 className="text-xl font-black uppercase italic mb-8 border-b border-white/5 pb-4">Sector Hubs</h3>
                 <div className="flex-grow overflow-y-auto space-y-3 scrollbar-hide pr-2">
                    {infrastructure.map((infra, i) => (<div key={i} onClick={() => setActiveRoute(infra)} className={`bg-white/5 p-5 rounded-[2rem] border transition-all cursor-pointer flex justify-between items-center ${activeRoute?.name === infra.name ? 'border-red-600 bg-red-600/10' : 'border-white/5'}`}><div><span className={`text-[8px] font-black uppercase block mb-1 ${infra.type === 'hospital' ? 'text-blue-500' : 'text-red-600'}`}>{infra.type}</span><h4 className="text-[11px] font-black uppercase italic text-white line-clamp-1">{infra.name}</h4></div></div>))}
                 </div>
              </aside>
           </div>
        ) : view === 'medical' ? (
          <div className="animate-blur-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {medicalData.map(m => (
              <div key={m.id} onClick={() => setActiveMedical(activeMedical === m.id ? null : m.id)} className={`bg-[#0A0A0A] p-10 rounded-[3.5rem] border transition-all cursor-pointer ${activeMedical === m.id ? 'border-red-600 md:col-span-2 lg:col-span-2' : 'border-white/5 hover:border-white/20'}`}>
                <div className="flex justify-between items-center mb-6"><span className="text-[10px] font-black text-red-600 uppercase">{m.level}</span><span className={`text-2xl font-black transition-transform ${activeMedical === m.id ? 'rotate-45 text-red-600' : 'text-white/10'}`}>+</span></div>
                <h3 className="text-3xl font-black italic uppercase mb-4 leading-none">{m.title}</h3>
                {activeMedical === m.id && (
                  <div className="pt-8 border-t border-white/5 mt-6 animate-slide-up space-y-10">
                    {m.hasPulse && <div className="bg-red-600/10 p-6 rounded-3xl border border-red-600/20 flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-widest text-red-600">CPR METRONOME ACTIVE</span><div className="w-8 h-8 bg-red-600 rounded-full animate-ping" style={{animationDuration: '0.54s'}} /></div>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div><span className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-6 block">Tactical Kit</span><div className="grid grid-cols-1 gap-2">{m.kit.map(k => <div key={k} className="flex gap-3 items-center bg-white/5 p-4 rounded-2xl"><span className="text-[10px] font-black text-white/60">✓ {k}</span></div>)}</div></div>
                       <div className="space-y-6"><span className="text-[10px] font-black uppercase tracking-widest text-white/20 block">Protocol Steps</span>{m.steps.map((s, i) => <div key={i} className="flex gap-4 items-start"><div className="w-6 h-6 bg-white text-black rounded-full flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</div><p className="text-sm text-white font-bold">{s}</p></div>)}</div>
                    </div>
                    <div className="pt-10 border-t border-white/5 flex gap-4"><button onClick={(e) => { e.stopPropagation(); setDroneRequested(m.title); }} className="flex-grow bg-white text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Request Med-Drone Payload</button></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : view === 'surveillance' ? (
          <div className="animate-blur-in grid grid-cols-1 lg:grid-cols-12 gap-8 h-[80vh]">
             <div className="lg:col-span-8 bg-[#0A0A0A] rounded-[4rem] border border-white/5 relative overflow-hidden"><TacticalMap center={coords} infra={infrastructure} activeTarget={null} filter="thermal" /></div>
             <div className="lg:col-span-4 space-y-6">{[1,2,3].map(i => (<div key={i} className="h-48 bg-[#0A0A0A] rounded-[2.5rem] border border-white/5 relative overflow-hidden"><div className="absolute top-4 left-4 flex items-center gap-2"><div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" /><span className="text-[8px] font-black text-white uppercase tracking-widest">CCTV {i} LIVE</span></div><div className="w-full h-full bg-[#111] flex items-center justify-center"><span className="text-white/5 text-4xl font-black italic">NO FEED</span></div></div>))}</div>
          </div>
        ) : view === 'chat' ? (
          <div className="h-[75vh] bg-[#0A0A0A] rounded-[4rem] border border-white/5 flex flex-col overflow-hidden shadow-2xl animate-blur-in">
             <div className="p-10 border-b border-white/5 bg-white/5 flex justify-between items-center"><h2 className="text-4xl font-black uppercase italic tracking-tighter">Neural AI Link</h2></div>
             <div className="flex-grow p-12 overflow-y-auto space-y-8 scrollbar-hide">{chatMessages.map((m, i) => <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[70%] p-8 rounded-[2.5rem] ${m.role === 'user' ? 'bg-white text-black shadow-2xl' : 'bg-white/5 text-white border border-white/10'}`}><p className="text-xl font-bold">{m.text}</p></div></div>)}</div>
             <form onSubmit={(e: any) => { e.preventDefault(); if(!chatInput.trim()) return; setChatMessages(p=>[...p, {role:'user',text:chatInput}]); setChatInput(''); }} className="p-10 bg-white/5 flex gap-6 border-t border-white/5 items-center"><input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-grow bg-transparent outline-none font-bold text-2xl text-white placeholder-[#222]" placeholder="Consult Neural Core..." /><button type="submit" className="px-12 py-5 bg-white text-black rounded-full font-black uppercase tracking-widest text-xs">Connect</button></form>
          </div>
        ) : null}

        {droneRequested && (
          <div className="fixed bottom-32 right-10 bg-emerald-600 text-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(5,150,105,0.4)] animate-slide-up z-[2000]"><div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black uppercase tracking-widest">Drone Dispatch Active</span><button onClick={() => setDroneRequested(null)}>×</button></div><h4 className="text-2xl font-black italic uppercase italic mb-2">Payload: {droneRequested} Kit</h4><p className="text-[11px] font-bold opacity-60">ETA to locus: 4 Mins 12 Secs</p></div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 w-full p-10 flex justify-between items-center bg-black/80 backdrop-blur-3xl border-t border-white/5 z-50">
         <div className="flex items-center gap-6"><button onClick={() => { setIsSosActive(true); setSosCountdown(10); setSosSent(false); }} className="bg-red-600 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase">Emergency SOS</button></div>
         <div className="flex gap-10 items-center text-right"><div className="flex flex-col"><span className="text-[9px] font-black uppercase text-[#444]">Sector Locus</span><span className="text-[11px] font-bold text-white tracking-widest">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span></div></div>
      </footer>
    </div>
  );
}

export default App;
