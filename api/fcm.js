import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';

/**
 * Resolves Firebase Admin credentials using the following priority order:
 *   1. FIREBASE_SERVICE_ACCOUNT environment variable (JSON string) — preferred for Vercel/production.
 *   2. firebase-service-account.json on the local filesystem — for local dev only (must be .gitignored).
 *
 * SECURITY: No credential fallback is permitted. If neither source is present the
 * handler returns a 503 instead of silently using a hardcoded key.
 * Rotate credentials at: https://console.firebase.google.com/project/gridguard-ai-730f6/settings/serviceaccounts/adminsdk
 */
function getFirebaseCredentials() {
  // 1. Environment variable as JSON string (set FIREBASE_SERVICE_ACCOUNT in Vercel dashboard)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('[FCM] FIREBASE_SERVICE_ACCOUNT env var is set but contains invalid JSON:', e.message);
      return null;
    }
  }

  // 2. Local filesystem fallback (firebase-service-account.json must be in .gitignore)
  try {
    const filePath = path.join(process.cwd(), 'firebase-service-account.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error('[FCM] Failed to read firebase-service-account.json:', e.message);
  }

  // No credentials available — fail explicitly rather than fall back to a hardcoded key.
  return null;
}

let firebaseApp = null;

function getAppInstance() {
  if (!firebaseApp) {
    const existing = getApps();
    if (existing.length > 0) {
      firebaseApp = existing[0];
    } else {
      const credentials = getFirebaseCredentials();
      if (!credentials) {
        return null;
      }
      firebaseApp = initializeApp({
        credential: cert(credentials),
      });
    }
  }
  return firebaseApp;
}

// Allowed origins for CORS — extend this list if additional verified front-end
// domains are added (e.g. preview deployments under *.vercel.app).
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://gridguard-ai.vercel.app',
];

export default async function handler(req, res) {
  // CORS — explicit origin allowlist instead of wildcard
  const origin = req.headers['origin'] || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { title, body, topic = 'gridguard-outages', data = {}, token } = req.body || {};

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required.' });
    }

    const app = getAppInstance();
    if (!app) {
      console.error('[FCM] Firebase credentials unavailable. Set FIREBASE_SERVICE_ACCOUNT env var.');
      return res.status(503).json({
        success: false,
        error: 'Firebase credentials not configured. Contact system administrator.',
        code: 'CREDENTIALS_MISSING',
      });
    }
    const messaging = getMessaging(app);

    const messagePayload = {
      notification: {
        title: String(title),
        body: String(body),
      },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
    };

    if (token) {
      messagePayload.token = token;
    } else {
      messagePayload.topic = topic;
    }

    const messageId = await messaging.send(messagePayload);

    return res.status(200).json({
      success: true,
      messageId,
      topic: messagePayload.topic || null,
      token: messagePayload.token ? messagePayload.token.slice(0, 10) + '...' : null,
      project: 'gridguard-ai-730f6',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Firebase FCM handler error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Firebase Messaging execution failed.',
      code: error.code || 'UNKNOWN_ERROR',
    });
  }
}
