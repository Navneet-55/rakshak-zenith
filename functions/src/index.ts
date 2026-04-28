import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';

admin.initializeApp();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING_API_KEY' });

export const rakshakSentry = onCall({ cors: true }, async (request: any) => {
  const startTime = Date.now();
  const data = request.data;
  const rawMessage = data.message;

  if (!rawMessage || typeof rawMessage !== 'string') {
    throw new HttpsError('invalid-argument', 'Message is required');
  }

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: `You are an AI Sentry for a Rapid Crisis Response system.
      Analyze the following emergency report and output strict JSON.
      Categories must be exactly one of: Fire, Medical, Security, General.
      
      PRIORITY INSTRUCTIONS (1-5):
      - 5: Critical life-threatening emergencies (e.g., active shooter, massive fire, cardiac arrest, weapons).
      - 4: High risk, fast response needed (e.g., severe injury, smoke, physical fight). Automatically bump priority to 4 or 5 if 'hasVisual' or 'hasAudio' media intel is true, as media implies evidence of a severe ongoing event.
      - 3: Moderate risk (e.g., suspicious person, minor injury).
      - 2: Low risk (e.g., noise complaint, property issue).
      - 1: Informational.
      
      Keep summary short.
      Provide one clear tactical instruction.
      
      Report context:
      Text: "${rawMessage}"
      Has Visual Intel Attached: ${data.hasVisual ? 'Yes' : 'No'}
      Has Audio Log Attached: ${data.hasAudio ? 'Yes' : 'No'}
      Is Silent/Stealth Mode Active: ${data.silentMode ? 'Yes' : 'No'}
      
      Output format:
      {
        "category": "string",
        "priority": number,
        "summary": "string",
        "instruction": "string"
      }`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const aiResultStr = response.text || '';
    const aiResult = JSON.parse(aiResultStr);

    const timeToOrchestrationMs = Date.now() - startTime;

    const alertData = {
      rawMessage,
      category: aiResult.category,
      priority: aiResult.priority,
      summary: aiResult.summary,
      instruction: aiResult.instruction,
      status: 'New',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      timeToOrchestrationMs
    };

    const docRef = await admin.firestore().collection('alerts').add(alertData);

    return { success: true, id: docRef.id, timeToOrchestrationMs };
  } catch (error) {
    console.error('Error processing emergency:', error);
    throw new HttpsError('internal', 'Failed to process report');
  }
});
