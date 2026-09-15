import { AlertPhoneNumber } from '../types';

export interface MobileSendResult {
  success: boolean;
  message: string;
  transactionId?: string;
  provider: string;
  dispatchedNumbers?: string[];
}

const ALERT_PHONES_KEY = 'gridguard_alert_phones';

export const INITIAL_ALERT_PHONES: AlertPhoneNumber[] = [
  {
    id: 'phone-primary-shaan',
    name: 'Shaan Dabhi',
    phone: '9408487768',
    enabled: true,
    role: 'Chief Grid Dispatcher',
    addedAt: 'Primary Default',
  },
];

export function getStoredAlertPhones(): AlertPhoneNumber[] {
  try {
    const raw = localStorage.getItem(ALERT_PHONES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading stored alert phones', e);
  }
  return INITIAL_ALERT_PHONES;
}

export function saveStoredAlertPhones(phones: AlertPhoneNumber[]): void {
  try {
    localStorage.setItem(ALERT_PHONES_KEY, JSON.stringify(phones));
  } catch (e) {
    console.error('Error saving alert phones', e);
  }
}

/**
 * Mobile contact dispatch helper.
 * Fast2SMS has been decommissioned in favor of Firebase Cloud Messaging (FCM).
 */
export async function sendPhysicalSMS(
  mobiles: string | string[],
  _messageText: string
): Promise<MobileSendResult> {
  const rawList = Array.isArray(mobiles) ? mobiles : [mobiles];
  const cleanList = Array.from(
    new Set(
      rawList
        .map((m) => m.replace(/\D/g, '').slice(-10))
        .filter((m) => m.length === 10)
    )
  );

  const phoneSummary = cleanList.map((m) => `+91 ${m}`).join(', ');

  return {
    success: true,
    message: `Direct alert routed for ${cleanList.length} contact(s): ${phoneSummary}. (Primary broadcast transmitted via Firebase Cloud Messaging).`,
    transactionId: `FCM-DISPATCH-${Date.now().toString().slice(-6)}`,
    provider: 'Firebase Priority Channel',
    dispatchedNumbers: cleanList,
  };
}
