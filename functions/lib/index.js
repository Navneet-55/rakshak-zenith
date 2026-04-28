"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.rakshakSentry = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const genai_1 = require("@google/genai");
admin.initializeApp();
const genAI = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING_API_KEY' });
exports.rakshakSentry = (0, https_1.onCall)({ cors: true }, async (request) => {
    const startTime = Date.now();
    const data = request.data;
    const rawMessage = data.message;
    if (!rawMessage || typeof rawMessage !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'Message is required');
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
    }
    catch (error) {
        console.error('Error processing emergency:', error);
        throw new https_1.HttpsError('internal', 'Failed to process report');
    }
});
//# sourceMappingURL=index.js.map