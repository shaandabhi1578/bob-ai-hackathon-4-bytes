import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';

function getFirebaseCredentials() {
  // 1. Environment variable as JSON string
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT env var', e);
    }
  }

  // 2. Read from filesystem
  try {
    const filePath = path.join(process.cwd(), 'firebase-service-account.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.warn('Failed to read firebase-service-account.json from filesystem', e);
  }

  // 3. Fallback credentials
  return {
    type: 'service_account',
    project_id: 'gridguard-ai-730f6',
    private_key_id: '8788ce8ba6c0983c4d771fffd9f690832ebed130',
    private_key:
      '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCw4kPupjTGl7Hf\naVq7hK6nnF6LUVBOPCyGVS43ul++YQPU7EDiM8CYCOSOGxd3PGrHy65R5aP8crxI\nFp0RQaF/FSlG9mRIQmXYVd9m3aRv4Zryak4Xe4vHp+D26nSpPC7cq3/FP2nrt2N8\nYi4dZcdymT5qsgmi1UDRS0ou/I1rOJp9J60A6fFC59tnLeMGSMFTytOa2sq7In4o\nOGPfNzcTC53TGYRs7lCGRRaQc1o6FoeGBVZWpDWyG1YjJ/B0UX/HS2Uq/8aqr5QO\nnifyIzjXf0nrJo7jXgKbx/lN/q8+0giJmuCp4jsmpKdvlm+1/D/rJs4AS3uJ6o/E\nNncVuJe9AgMBAAECggEAFZNj6eZIJbk3LyMwuBLVIwjF14SRoRlh7PjS7GVFbHl0\n+DHhMDZT1bev+U2ArUCnXbuQhdjXCeIM6VYozoQM6O1x3YAMd2vx9FN1Lpz2g9cn\nCU7CO8cMI8xsenHazRHUPYKF0U+M4f26mt929IsHqwjaPjV9S2lrwJvIbrbLoTpQ\nXxSq6sqAAOreYUbUZXOWY1fn1qRJ2X8PsJeMxJoqJGTt+2vLGNayzV1CDIIl4xix\nA6BeK8F0DJpy+gElPRMURzchvadz22ZFOlsMsvgtxY58uiaQZGiY5R4rcrEwavkS\nfjpnLKIB0A7szjyVoHqVmEJspyw+wCOTXhsUjiLQwQKBgQDase5QMB01fMcNxs4T\naRNHhe/UxSZjZXq4RTnJ668r86aeDpKvwxksdbCDU5vKN7A85PwqhNBQ6/a0bW5W\nnL6Jv0ZQZdvRho+gn4txQ9HC5uPQ5Wu3vrUpcQCiOZsewCCKFwcxKETLuMR3CQ4p\nwtCJkoUtzeeSdCxjNdVAbpgAOQKBgQDPDoFaRWLFyLnmiVefka5GiS/B1/E7ye/7\nL45o4riRadkbK0RVDzon+D19FaNqLmHGqjZbJ3Tt4FrUa9+rcsCVgGKPhmYy65D5\nwSx9vdqQVg0Vuj1qviapNEmo58qEpAy3Jwka0VEjyVANpjcxWz32r/4EkrCUFLUo\nuTaqF64LpQKBgCsM3bHRVt6hmnmeyhBOHep1djm3OZBVeKvvjKmwCIKpawIwMjYB\nPOJgpIelnMRY5AuItA8Wp/9WA/GOnSrVnjh1e7z14CjFyV5AKe35AMDSPMRxdRvt\nobHvucU1e9C41273i4XkvG4yCBK6qJwV6oE6Y5cZsl1FGzvIbBtL6gYZAoGANLBn\nQDZp5RSoIb8PWh6zL2XXjkdKLsG7XLsETTJsbyx1P9GpyM9gKC2mT/9Cn1GANhK4\nVEfdHG88DdQJjdJcqW6LJiS4Ovrw4G1EyhaW2KXdHItQ96m9os8Yc2/QfCJWzgCT\n84wSTr36rg5++wNR6EVuqXE+l+ARHXTMMUpnUrUCgYEAiyKHVfP5WCr6kcEWceuq\npGlcF6non5Fv2hkVGujTLqDtuiwxJOkQnxg1iJn4hyiNAkCe5ehKUdurykYbw3Wj\npJqty6Une3LwLH+Kd1jn/et6s+9/Pw7+TS4kT9cOCqDaKHAFRHarxeLvg6ChYUBQ\nmAH+8Tl48jrL7dCDSAEWFiQ=\n-----END PRIVATE KEY-----\n',
    client_email: 'firebase-adminsdk-fbsvc@gridguard-ai-730f6.iam.gserviceaccount.com',
  };
}

let firebaseApp = null;

function getAppInstance() {
  if (!firebaseApp) {
    const existing = getApps();
    if (existing.length > 0) {
      firebaseApp = existing[0];
    } else {
      const credentials = getFirebaseCredentials();
      firebaseApp = initializeApp({
        credential: cert(credentials),
      });
    }
  }
  return firebaseApp;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, authorization'
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
