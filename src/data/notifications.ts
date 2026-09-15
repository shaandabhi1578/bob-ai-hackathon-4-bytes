import { OutageRecipient, OutageNotification } from '../types';

export const INITIAL_RECIPIENTS: OutageRecipient[] = [
  {
    id: 'REC-PRIMARY',
    name: 'Shaan Dabhi (Chief Dispatcher Phone)',
    mobile: '+91 9408487768',
    region: 'Ahmedabad West',
    assetId: 'T-104',
    type: 'Critical Infrastructure (Hospital/Water)',
    verified: true,
  },
  {
    id: 'REC-01',
    name: 'Apollo International Hospital Emergency Ops',
    mobile: '+91 98250 11401',
    region: 'Ahmedabad West',
    assetId: 'T-104',
    type: 'Critical Infrastructure (Hospital/Water)',
    verified: true,
  },
  {
    id: 'REC-02',
    name: 'Sabarmati Municipal Water Pumping Station 2',
    mobile: '+91 98250 88219',
    region: 'Ahmedabad West',
    assetId: 'T-104',
    type: 'Critical Infrastructure (Hospital/Water)',
    verified: true,
  },
  {
    id: 'REC-03',
    name: 'Torrent Pharma / Zydus Tech Park Feeder',
    mobile: '+91 94260 33190',
    region: 'Ahmedabad West',
    assetId: 'T-104',
    type: 'Industrial Feeder',
    verified: true,
  },
  {
    id: 'REC-04',
    name: 'Ahmedabad West Discom Sub-division Office',
    mobile: '+91 79232 50011',
    region: 'Ahmedabad West',
    assetId: 'T-104',
    type: 'Commercial Complex',
    verified: true,
  },
  {
    id: 'REC-05',
    name: 'Sabarmati Riverfront Power Sub-circle',
    mobile: '+91 99099 44120',
    region: 'Ahmedabad West',
    assetId: 'T-104',
    type: 'Residential Distribution',
    verified: true,
  },
  {
    id: 'REC-06',
    name: 'Vastral Metro Station Traction Feeder',
    mobile: '+91 98790 55102',
    region: 'Ahmedabad East',
    assetId: 'T-208',
    type: 'Critical Infrastructure (Hospital/Water)',
    verified: true,
  },
  {
    id: 'REC-07',
    name: 'Sanand Industrial Association Grid Desk',
    mobile: '+91 97243 89012',
    region: 'Sanand Industrial Corridor',
    assetId: 'CB-44',
    type: 'Industrial Feeder',
    verified: true,
  },
  {
    id: 'REC-08',
    name: 'Gandhinagar Government Secretariat Sub-station',
    mobile: '+91 79232 20100',
    region: 'Gandhinagar North',
    assetId: 'T-112',
    type: 'Critical Infrastructure (Hospital/Water)',
    verified: true,
  },
];

export const INITIAL_NOTIFICATIONS: OutageNotification[] = [
  {
    id: 'NOTIF-2026-001',
    timestamp: '2026-09-12 09:15',
    region: 'Ahmedabad East',
    affectedAssetId: 'T-208',
    affectedAssetName: 'Transformer T-208',
    windowStart: '10:00',
    windowEnd: '12:30',
    durationHours: 2.5,
    reason: 'Preventive oil sampling and bushing inspection',
    recipientsCount: 4,
    status: 'Simulated Sent',
    messageText: `[GRIDGUARD AI ALERT]
Region: Ahmedabad East
Affected Asset: Transformer T-208
Expected Outage Window: 10:00 – 12:30 (2.5 hrs)
Reason: Preventive oil sampling and bushing inspection.
Secondary backup feeds energized where available.`,
  },
];
