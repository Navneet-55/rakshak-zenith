# Rakshak - Rapid Crisis Response System

Repo: `rakshak-zenith`

## Overview
Rakshak is a full-stack Rapid Crisis Response platform built for the **Solution Challenge 2026**. It reduces communication silos in hospitality environments by using agentic AI to classify, route, and manage emergencies in real time.

By focusing on ultra-fast orchestration and rapid response, Rakshak supports **SDG #11 (Sustainable Cities and Communities)**.

## What Makes Us Unique
- **Sentry Intent Logic**: Uses Gemini 1.5 Pro to perform semantic analysis on natural language incident reports.
- **Tactical Response Dashboard**: A zero-refresh interface for staff with live, color-coded alert cards and AI-generated instructions.
- **Decentralized Coordination**: Firestore-backed real-time data fusion across responder roles (Medical, Fire, Security).
- **Orchestration Telemetry**: Logging to track and display time-to-orchestration.
- **Accessibility-First Intake**: Mobile-responsive portal for rapid distress reporting, including a stealth protocol for active threats.

## Technical Stack
- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Node.js/TypeScript (Firebase Cloud Functions v2)
- **Database**: Firestore (Real-time synchronization)
- **AI Engine**: Gemini (`@google/genai`)

## Automated Deployment
This project includes GitHub Actions for automated CI/CD to Firebase Hosting and Cloud Functions.

## Local Setup
1. Install dependencies (root): `npm install --legacy-peer-deps`
2. Start the frontend: `npm run dev`
3. Install backend deps: `cd functions && npm install --legacy-peer-deps`
4. Set `GEMINI_API_KEY` and deploy/emulate Firebase functions.
