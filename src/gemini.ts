const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

export type SentryResult = {
  category: string;
  priority: number;
  summary: string;
  instruction: string;
  sentiment?: string;
};

// --- ZENITH INTELLIGENCE ENGINE (V5) ---
function zenithLocalEngine(params: any): SentryResult {
  const text = params.message.toLowerCase();
  let priority = 1;
  let category = "Security";
  let instruction = "Signal confirmed. Monitoring your GPS sector.";
  let summary = params.message.length > 35 ? params.message.substring(0, 35) + "..." : params.message;

  const isPanicked = (params.message === params.message.toUpperCase() && params.message.length > 4) || params.message.includes('!!!');

  const groups = {
    medical: ['medical', 'heart', 'breath', 'bleed', 'hurt', 'pain', 'fall', 'doctor', 'ambulance', 'seizure', 'unconscious'],
    fire: ['fire', 'smoke', 'burn', 'explosion', 'gas', 'leak', 'hazmat'],
    security: ['assault', 'weapon', 'gun', 'kill', 'attack', 'rape', 'theft', 'intruder', 'hiding', 'help', 'panic', 'emergency']
  };

  const p5 = ['rape', 'kill', 'gun', 'shooter', 'unconscious', 'heart', 'explosion', 'help', 'emergency'];
  const p4 = ['medical', 'assault', 'fire', 'smoke', 'intruder', 'bleed', 'pain', 'fight', 'hiding'];

  if (groups.medical.some(k => text.includes(k))) category = "Medical";
  else if (groups.fire.some(k => text.includes(k))) category = "Fire";
  else if (groups.security.some(k => text.includes(k))) category = "Security";

  if (p5.some(k => text.includes(k)) || (params.vitals && params.vitals > 150)) {
    priority = 5;
    instruction = "CRITICAL: Tactical units & Med-Drone routing now. Silence all gear.";
  } else if (p4.some(k => text.includes(k)) || (params.vitals && params.vitals > 120) || isPanicked || params.silentMode) {
    priority = 4;
    instruction = "URGENT: Response team dispatched. Secure position and wait for link.";
  } else if (category !== "Security" || text.length > 5) {
    priority = 3;
    instruction = "Incident logged. Intelligence scanning media feed for escalation.";
  }

  return { category, priority, summary, instruction, sentiment: isPanicked ? "PANIC" : "STABLE" };
}

export async function rakshakSentry(params: {
  message: string;
  silentMode: boolean;
  hasVisual: boolean;
  hasAudio: boolean;
  vitals: number | null;
  drone: boolean;
}): Promise<SentryResult> {
  
  const models = ['gemini-1.5-flash', 'gemini-pro'];
  
  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600); // Zenith-speed: 600ms

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Analyze emergency: ${params.message}. Priority 1-5. Respond JSON: {"category": "Fire|Medical|Security|General", "priority": 1-5, "summary": "...", "instruction": "..."}` }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 150 },
        }),
      });

      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return { ...JSON.parse(text), sentiment: "AI" };
      }
    } catch (e) { }
  }

  return zenithLocalEngine(params);
}
