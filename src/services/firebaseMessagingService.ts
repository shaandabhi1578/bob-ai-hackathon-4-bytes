export interface FCMResult {
  success: boolean;
  messageId?: string;
  topic?: string;
  project?: string;
  timestamp?: string;
  error?: string;
}

/**
 * Sends a real-time push notification broadcast via Firebase Cloud Messaging (FCM).
 * Connected to project: gridguard-ai-730f6.
 */
export async function sendFirebaseOutageAlert(params: {
  title: string;
  body: string;
  topic?: string;
  data?: Record<string, string>;
}): Promise<FCMResult> {
  try {
    const response = await fetch('/api/fcm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: params.title,
        body: params.body,
        topic: params.topic || 'gridguard-outages',
        data: params.data || {},
      }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      return {
        success: true,
        messageId: data.messageId,
        topic: data.topic,
        project: data.project,
        timestamp: data.timestamp,
      };
    } else {
      return {
        success: false,
        error: data.error || 'Firebase Cloud Messaging API error.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Firebase service connection error: ${err.message}`,
    };
  }
}
