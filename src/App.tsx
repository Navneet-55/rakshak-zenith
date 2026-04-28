import React, { useState, useEffect, useRef } from 'react';
import { Shield, Activity, MapPin, Camera, Mic, HeartPulse, Plane, BrainCircuit, Loader2, Terminal, Volume2, Eye, Bluetooth, BluetoothConnected, XCircle, Send, MessageSquare, AlertTriangle, Radio, History, PlusCircle, CheckCircle } from 'lucide-react';
import { rakshakSentry, SentryResult } from './gemini';

interface Alert extends SentryResult {
  id: string; timeToOrchestrationMs: number; 
  vitals?: number; drone?: boolean; isSilent?: boolean; timestamp: string;
  lat: number; lng: number; isResolved?: boolean;
}

type ViewState = 'portal' | 'dashboard' | 'map' | 'chat' | 'medical' | 'archive';

function App() {
  const [view, setView] = useState<ViewState>('portal');
  const [report, setReport] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [biometrics, setBiometrics] = useState(false);
  const [heartRate, setHeartRate] = useState(72);
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] Zenith Build Active.", "[SYSTEM] Safety Protocols: ON"]);
  const [activeIntel, setActiveIntel] = useState<string | null>(null);
  const [coords, setCoords] = useState({ lat: 34.0522, lng: -118.2437 });
  const [chatMessages, setChatMessages] = useState<any[]>([{ role: 'ai', text: 'Namaste. Rakshak main aapki kya madad kar sakta hoon?', timestamp: 'Now' }]);
  const [chatInput, setChatInput] = useState('');
  const [isSosActive, setIsSosActive] = useState(false);
  const [sosTimer, setSosTimer] = useState(10);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
    }
  }, []);

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);

  const sendChat = (e: any) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = { role: 'user', text: chatInput, timestamp: new Date().toLocaleTimeString() };
    setChatMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');

    setTimeout(async () => {
      try {
        const result = await rakshakSentry({ message: currentInput, silentMode: false, hasVisual: false, hasAudio: false, vitals: null, drone: false });
        setChatMessages(prev => [...prev, { role: 'ai', text: result.instruction, timestamp: new Date().toLocaleTimeString() }]);
      } catch (err) { addLog("Chat AI Fallback active."); }
    }, 10);
  };

  const handleResolve = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isResolved: true } : a));
    addLog("Tactical data moved to Archive.");
  };

  const triggerSos = () => {
    setIsSosActive(true);
    let t = 10;
    const i = setInterval(() => {
      t -= 1; setSosTimer(t);
      if (t <= 0) { clearInterval(i); submitSos(); }
    }, 1000);
  };

  const submitSos = async () => {
    const r = await rakshakSentry({ message: "SOS EMERGENCY", silentMode: true, hasVisual: true, hasAudio: true, vitals: 160, drone: true });
    setAlerts(prev => [{ id: `sos-${Date.now()}`, ...r, priority: 5, category: 'Security', timeToOrchestrationMs: 0, timestamp: 'EMERGENCY', lat: coords.lat, lng: coords.lng }, ...prev]);
    setIsSosActive(false); setView('dashboard');
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!report.trim()) return;
    setIsSubmitting(true);
    const start = Date.now();
    try {
      const res = await rakshakSentry({ message: report, silentMode: false, hasVisual: false, hasAudio: false, vitals: biometrics ? heartRate : null, drone: false });
      setAlerts(prev => [{ id: `${Date.now()}`, ...res, timeToOrchestrationMs: Date.now() - start, timestamp: new Date().toLocaleTimeString(), lat: coords.lat + (Math.random()-0.5)*0.01, lng: coords.lng + (Math.random()-0.5)*0.01 }, ...prev]);
    } catch (err) { addLog("Sentry Sync Error."); }
    finally { setReport(''); setIsSubmitting(false); setView('dashboard'); }
  };

  return (
    <div className="min-h-screen bg-black text-[#F5F5F7] font-sans overflow-x-hidden">
      {isSosActive && (
        <div className="fixed inset-0 bg-red-600 z-[2000] flex flex-col items-center justify-center p-10 animate-pulse text-white text-center">
          <AlertTriangle className="w-40 h-40 mb-10" />
          <h1 className="text-9xl font-black italic uppercase mb-4">SOS Active</h1>
          <p className="text-3xl font-bold opacity-80 uppercase tracking-widest">TRANSMITTING IN {sosTimer}S</p>
        </div>
      )}

      {activeIntel && (
        <div className="fixed inset-0 bg-black/95 z-[500] flex items-center justify-center p-12 animate-blur-in">
           <div className="w-full max-w-5xl h-[80vh] bg-[#0A0A0A] rounded-[4rem] border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
              <Plane className="w-32 h-32 text-white/5 animate-bounce" />
              <button onClick={() => setActiveIntel(null)} className="absolute bottom-16 bg-white text-black px-12 py-5 rounded-full font-black uppercase tracking-widest text-lg">Close Feed</button>
           </div>
        </div>
      )}

      <nav className="fixed top-0 w-full z-[400] bg-black/70 backdrop-blur-3xl border-b border-white/5 px-10 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3"><Shield className="w-6 h-6 text-white" /><span className="text-2xl font-black tracking-tighter uppercase italic">Rakshak <span className="text-red-600">Zenith</span></span></div>
        <div className="flex gap-8 items-center">
          {['portal', 'dashboard', 'map', 'medical', 'chat', 'archive'].map(v => (
            <button key={v} onClick={() => setView(v as ViewState)} className={`text-[11px] font-black uppercase tracking-widest transition-all ${view === v ? 'text-white underline underline-offset-8 decoration-red-600 decoration-2' : 'text-white/20 hover:text-white/50'}`}>{v}</button>
          ))}
          <button onClick={triggerSos} className="bg-red-600 text-white px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(220,38,38,0.3)]">SOS</button>
        </div>
      </nav>

      <main className="pt-40 pb-48 px-10 max-w-[1300px] mx-auto">
        {view === 'portal' ? (
          <div className="animate-blur-in max-w-4xl mx-auto">
            <h1 className="text-8xl font-black tracking-tighter text-white uppercase italic leading-[0.8] mb-20">Protect.<br /><span className="text-white/10">Now.</span></h1>
            <form onSubmit={handleSubmit} className="bg-[#0A0A0A] rounded-[4rem] p-16 border border-white/5 shadow-2xl">
               <textarea value={report} onChange={e => setReport(e.target.value)} placeholder="State the emergency..." className="w-full h-40 bg-transparent border-none text-4xl font-bold tracking-tighter text-white outline-none resize-none mb-10 placeholder-[#222]" />
               <div className="flex justify-between items-center pt-10 border-t border-white/5">
                  <div className="flex gap-6"><button type="button" onClick={() => setBiometrics(!biometrics)} className={`p-6 rounded-3xl transition-all ${biometrics ? 'bg-red-600' : 'bg-white/5'}`}><HeartPulse className="w-6 h-6" /></button></div>
                  <button type="submit" disabled={isSubmitting} className="bg-white text-black px-16 py-6 rounded-[2.5rem] font-black text-2xl uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all shadow-2xl">Launch</button>
               </div>
            </form>
          </div>
        ) : view === 'dashboard' ? (
          <div className="animate-blur-in">
            <h1 className="text-7xl font-black tracking-tighter italic uppercase text-white mb-20">Tactical.</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {alerts.filter(a => !a.isResolved).map(a => (
                 <div key={a.id} className="bg-[#0A0A0A] p-10 rounded-[3rem] border border-white/5 animate-slide-up">
                    <div className="flex justify-between items-center mb-8"><span className="text-[10px] font-black tracking-[0.4em] text-[#444] uppercase">{a.category}</span><div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase ${a.priority >= 4 ? 'bg-red-600 text-white' : 'bg-white text-black'}`}>P{a.priority}</div></div>
                    <h3 className="text-3xl font-black tracking-tighter text-white mb-6 uppercase italic leading-none">{a.summary}</h3>
                    <p className="text-[16px] text-[#86868B] font-bold mb-10 leading-relaxed">{a.instruction}</p>
                    <div className="flex gap-4 pt-8 border-t border-white/5">
                       <button onClick={() => setActiveIntel(a.id)} className="flex-grow bg-white/5 p-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all font-black text-[10px] uppercase tracking-widest"><Eye className="w-4 h-4" /> Intel</button>
                       <button onClick={() => handleResolve(a.id)} className="flex-grow bg-white/5 p-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"><CheckCircle className="w-4 h-4" /> Resolve</button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        ) : view === 'map' ? (
          <div className="animate-blur-in h-[75vh] bg-[#0A0A0A] rounded-[4rem] border border-white/5 relative overflow-hidden">
             <iframe className="w-full h-full grayscale invert opacity-30 contrast-150" src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng-0.01}%2C${coords.lat-0.01}%2C${coords.lng+0.01}%2C${coords.lat+0.01}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`} />
          </div>
        ) : view === 'medical' ? (
          <div className="animate-blur-in">
            <h1 className="text-7xl font-black tracking-tighter italic uppercase text-white mb-16">Medical.</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {['CPR Technique', 'Bleeding Control', 'Airway Obstruction', 'Burn Relief'].map((m, i) => (
                 <div key={i} className="bg-[#0A0A0A] p-12 rounded-[3.5rem] border border-white/5 hover:border-red-600/30 transition-all">
                    <h3 className="text-3xl font-black uppercase italic mb-4">{m}</h3>
                    <p className="text-lg text-[#86868B] font-bold">Deploying mission-critical first-aid data... [LINK SECURE]</p>
                 </div>
               ))}
            </div>
          </div>
        ) : view === 'chat' ? (
          <div className="animate-blur-in h-[75vh] flex flex-col bg-[#0A0A0A] rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl">
             <div className="p-10 border-b border-white/5 bg-white/5 flex justify-between items-center"><h2 className="text-4xl font-black uppercase italic tracking-tighter">Rakshak AI</h2></div>
             <div className="flex-grow p-10 overflow-y-auto space-y-8 scrollbar-hide">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-8 rounded-[2.5rem] ${m.role === 'user' ? 'bg-white text-black shadow-2xl' : 'bg-white/5 text-white border border-white/10'}`}><p className="text-xl font-bold leading-relaxed">{m.text}</p></div>
                  </div>
                ))}
             </div>
             <form onSubmit={sendChat} className="p-10 bg-white/5 flex gap-6 items-center border-t border-white/5">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask for tactical advice..." className="flex-grow bg-transparent border-none text-xl font-bold outline-none text-white placeholder-[#222]" />
                <button type="submit" className="p-6 bg-white text-black rounded-full hover:scale-110 active:scale-95 transition-all shadow-2xl"><Send className="w-6 h-6" /></button>
             </form>
          </div>
        ) : (
          <div className="animate-blur-in">
             <h1 className="text-8xl font-black tracking-tighter italic uppercase text-white mb-20">History.</h1>
             <div className="space-y-6">
                {alerts.filter(a => a.isResolved).map(a => (
                  <div key={a.id} className="bg-[#0A0A0A] p-8 rounded-[2.5rem] border border-white/5 flex justify-between items-center opacity-40">
                    <h3 className="text-2xl font-black uppercase italic">{a.summary}</h3>
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 w-full bg-black/80 backdrop-blur-3xl border-t border-white/5 px-12 py-8 flex justify-between items-center z-[400]">
         <div className="flex gap-16"><div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-[#444] mb-2">Neural Status</span><span className="text-sm font-black text-emerald-600 uppercase italic">ACTIVE</span></div></div>
         <span className="text-sm font-black text-white uppercase italic">{new Date().toLocaleTimeString()}</span>
      </footer>
    </div>
  );
}

export default App;
