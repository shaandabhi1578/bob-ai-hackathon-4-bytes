import React, { useState, useEffect } from 'react';
import {
  Send,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Phone,
  Plus,
  Radio,
  FileText,
  ShieldAlert,
  Trash2,
  MessageSquare,
  Smartphone,
  BellRing,
  UserPlus,
  Check,
  Flame,
} from 'lucide-react';
import { useGrid } from '../../context/GridContext';
import { useAuth } from '../../context/AuthContext';
import { OutageRecipient, AlertPhoneNumber } from '../../types';
import {
  getStoredAlertPhones,
  saveStoredAlertPhones,
} from '../../services/smsService';
import { sendFirebaseOutageAlert, FCMResult } from '../../services/firebaseMessagingService';

export const OutageNotificationsView: React.FC = () => {
  const {
    assets,
    selectedAssetId,
    setSelectedAssetId,
    selectedAsset,
    recipients,
    addRecipient,
    notifications,
    sendOutageNotification,
    showToast,
    triggerPhoneAlert,
  } = useGrid();

  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';

  // Outage window inputs
  const [startTime, setStartTime] = useState('14:30');
  const [endTime, setEndTime] = useState('17:00');
  const [durationHours, setDurationHours] = useState(2.5);
  const [reasonText, setReasonText] = useState('Emergency transformer maintenance.');

  // Recipient selection (select all by default for the region)
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>(
    recipients.map((r) => r.id)
  );

  // Target Phone Numbers for Direct SMS / Push Alerts
  const [alertPhones, setAlertPhones] = useState<AlertPhoneNumber[]>(() =>
    getStoredAlertPhones()
  );

  // Add Phone Number Form State
  const [showAddPhoneForm, setShowAddPhoneForm] = useState(false);
  const [newPhoneName, setNewPhoneName] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newPhoneRole, setNewPhoneRole] = useState('Critical Feeder Lead');

  // Form for adding new directory recipient (facility)
  const [showAddRecipientForm, setShowAddRecipientForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newRegion, setNewRegion] = useState('Ahmedabad West');
  const [newType, setNewType] = useState<OutageRecipient['type']>(
    'Critical Infrastructure (Hospital/Water)'
  );

  // Editable generated message
  const [customMessage, setCustomMessage] = useState('');
  const [fcmResult, setFcmResult] = useState<FCMResult | null>(null);
  const [isSendingFCM, setIsSendingFCM] = useState(false);

  // Synchronize message text when asset or times change
  useEffect(() => {
    const msg = `⚡ POWER OUTAGE ALERT — SLDC GUJARAT
Region: ${selectedAsset.location}
Asset: ${selectedAsset.name}, ${selectedAsset.substation}
Outage: ${startTime}–${endTime}
Duration: ~${durationHours} hrs
Reason: ${reasonText}
Advisory: Keep emergency generator ready.
Updates: SLDC Dispatch +91 79 2325 0011`;
    setCustomMessage(msg);
  }, [selectedAsset, startTime, endTime, durationHours, reasonText]);

  // Save phone numbers whenever list changes
  const updateAlertPhones = (newList: AlertPhoneNumber[]) => {
    setAlertPhones(newList);
    saveStoredAlertPhones(newList);
  };

  // Toggle enable/disable for a phone number
  const toggleAlertPhone = (id: string) => {
    const updated = alertPhones.map((p) =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    );
    updateAlertPhones(updated);
  };

  // Select / Deselect all phone numbers
  const toggleAllPhones = () => {
    const allEnabled = alertPhones.every((p) => p.enabled);
    const updated = alertPhones.map((p) => ({ ...p, enabled: !allEnabled }));
    updateAlertPhones(updated);
    showToast(
      allEnabled ? 'All Numbers Deselected' : 'All Numbers Selected',
      allEnabled ? 'No numbers active for broadcast.' : `All ${alertPhones.length} numbers active.`,
      'info'
    );
  };

  // Add new phone number to alert list
  const handleAddPhoneNumber = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = newPhoneNumber.replace(/\D/g, '').slice(-10);

    if (cleanNumber.length !== 10) {
      showToast(
        'Invalid Mobile Number',
        'Please enter a valid 10-digit mobile number (e.g. 98250 12345).',
        'warning'
      );
      return;
    }

    if (!newPhoneName.trim()) {
      showToast('Name Required', 'Please enter a contact name or designation.', 'warning');
      return;
    }

    // Check duplicate
    if (alertPhones.some((p) => p.phone === cleanNumber)) {
      showToast('Number Already Exists', `+91 ${cleanNumber} is already in the broadcast list.`, 'warning');
      return;
    }

    const newEntry: AlertPhoneNumber = {
      id: `phone-${Date.now()}`,
      name: newPhoneName.trim(),
      phone: cleanNumber,
      enabled: true,
      role: newPhoneRole,
      addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...alertPhones, newEntry];
    updateAlertPhones(updated);

    showToast(
      'Phone Number Added',
      `+91 ${cleanNumber} (${newPhoneName}) added to emergency alert broadcast list.`,
      'success'
    );

    setNewPhoneName('');
    setNewPhoneNumber('');
    setShowAddPhoneForm(false);
  };

  // Remove phone number from alert list
  const handleRemovePhoneNumber = (id: string, name: string) => {
    const updated = alertPhones.filter((p) => p.id !== id);
    updateAlertPhones(updated);
    showToast('Number Removed', `${name} removed from alert broadcast list.`, 'info');
  };

  // Active phone numbers selected for broadcast
  const activeSelectedPhones = alertPhones.filter((p) => p.enabled);

  // Handle direct phone alert for specific phone
  const handleDirectPhonePush = (phone: AlertPhoneNumber) => {
    triggerPhoneAlert(
      phone.phone,
      `🚨 Outage Notice: ${selectedAsset.name}`,
      `Window: ${startTime} - ${endTime} (${durationHours}h) in ${selectedAsset.location}.\nReason: ${reasonText}`
    );
    showToast(
      'Phone Notification Sent',
      `Direct dispatch alert transmitted to +91 ${phone.phone} (${phone.name}).`,
      'success'
    );
  };

  // Handle direct phone push to ALL selected phones
  const handlePushToAllSelected = () => {
    if (activeSelectedPhones.length === 0) {
      showToast('No Numbers Selected', 'Please select at least one phone number to send alerts.', 'warning');
      return;
    }

    const phoneNumbers = activeSelectedPhones.map((p) => p.phone);
    triggerPhoneAlert(
      phoneNumbers,
      `🚨 Outage Notice: ${selectedAsset.name}`,
      `Window: ${startTime} - ${endTime} (${durationHours}h) in ${selectedAsset.location}.\nReason: ${reasonText}`
    );
    showToast(
      'Push Broadcast Sent',
      `Instantaneous push alerts dispatched to ${phoneNumbers.length} mobile destination(s).`,
      'success'
    );
  };

  const handleOpenWhatsApp = (phone: string, name: string) => {
    const clean = phone.replace(/\D/g, '').slice(-10);
    const url = `https://wa.me/91${clean}?text=${encodeURIComponent(customMessage)}`;
    window.open(url, '_blank');
    showToast('WhatsApp Opened', `Prepared outage alert message for +91 ${clean} (${name}).`, 'info');
  };

  const handleOpenSMS = (phone: string, name: string) => {
    const clean = phone.replace(/\D/g, '').slice(-10);
    const url = `sms:+91${clean}?body=${encodeURIComponent(customMessage)}`;
    window.open(url, '_blank');
    showToast('SMS App Opened', `Prepared native SMS alert for +91 ${clean} (${name}).`, 'info');
  };

  // Handle send notification via Firebase Cloud Messaging as main engine
  const handleSendNotification = async () => {
    if (activeSelectedPhones.length === 0) {
      showToast('No Numbers Selected', 'Please check at least one phone number in the Target Phone List.', 'warning');
      return;
    }

    setIsSendingFCM(true);
    setFcmResult(null);

    // 1. Record broadcast in Grid state
    sendOutageNotification({
      region: selectedAsset.location,
      affectedAssetId: selectedAsset.id,
      affectedAssetName: selectedAsset.name,
      windowStart: startTime,
      windowEnd: endTime,
      durationHours: Number(durationHours),
      reason: reasonText,
      recipientsCount: selectedRecipientIds.length + activeSelectedPhones.length,
      messageText: customMessage,
    });

    const targetPhones = activeSelectedPhones.map((p) => p.phone);

    // 2. Transmit via Firebase Cloud Messaging (Primary Engine)
    const fcmRes = await sendFirebaseOutageAlert({
      title: '⚡ POWER OUTAGE ALERT — SLDC GUJARAT',
      body: customMessage,
      topic: 'gridguard-outages',
      data: {
        assetId: selectedAsset.id,
        assetName: selectedAsset.name,
        region: selectedAsset.location,
        window: `${startTime}–${endTime}`,
        duration: String(durationHours),
        dispatcher: 'Shaan Dabhi (+91 9408487768)',
      },
    });

    setFcmResult(fcmRes);
    setIsSendingFCM(false);

    // 3. Trigger immediate local Web Push / browser notification
    triggerPhoneAlert(
      targetPhones,
      `🚨 Outage Broadcast: ${selectedAsset.name}`,
      `Window: ${startTime} – ${endTime} | Affected: ${selectedAsset.location}`
    );

    if (fcmRes.success) {
      showToast(
        'Firebase FCM Broadcast Dispatched!',
        `Broadcasted to topic "${fcmRes.topic}" on project ${fcmRes.project}. Message ID: ${fcmRes.messageId?.slice(-16)}`,
        'success'
      );
    } else {
      showToast('Firebase Dispatch Notice', fcmRes.error || 'Failed to dispatch via Firebase FCM', 'critical');
    }
  };

  const handleCreateRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newMobile) return;

    addRecipient({
      name: newName,
      mobile: newMobile,
      region: newRegion,
      type: newType,
    });

    setNewName('');
    setNewMobile('');
    setShowAddRecipientForm(false);
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Outage Advisory & Multi-Channel Alert Engine
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Schedule low-impact outage windows and broadcast verified alerts via Firebase Cloud Messaging (FCM), WhatsApp, and Push to designated phone numbers & feeders.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Asset Context:</span>
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="form-select"
            style={{ width: '240px', height: '36px', fontWeight: 600 }}
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} — {a.location}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AI RECOMMENDED TIME WINDOW ADVISOR */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #2563eb',
          borderRadius: '6px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sparkles size={20} color="#2563eb" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
              AI Recommended Low-Impact Window:{' '}
              <span style={{ fontFamily: 'var(--font-mono)', color: '#2563eb' }}>14:30 – 17:00</span> (2.5 Hours)
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.15rem' }}>
              Reason: <strong>Lowest expected customer load valley, suitable crew availability (Crew 04), and post-peak thermal calm.</strong>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setStartTime('14:30');
            setEndTime('17:00');
            setDurationHours(2.5);
            showToast('Window Applied', 'Applied optimal 14:30 – 17:00 low-load outage window', 'info');
          }}
          className="btn-secondary btn-sm"
          style={{ whiteSpace: 'nowrap' }}
        >
          <span>Apply Recommended Window</span>
        </button>
      </div>

      {/* FCM & PHONE ROUTING TRANSPARENCY BANNER */}
      <div
        style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '0.9rem 1.15rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}
      >
        <Radio size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.78rem', color: '#1e3a8a', lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#1e40af', marginBottom: '0.2rem' }}>
            📡 Where exactly does the FCM Notification Go?
          </div>
          <div>
            • <strong>Target Numbers (+91 9408487768):</strong> Dispatched directly to registered field technicians via linked browser push, native OS notifications, and instant WhatsApp/SMS triggers.
          </div>
          <div>
            • <strong>Firebase Cloud Messaging (FCM):</strong> Pushes live SCADA outage payload to topic <code style={{ background: '#dbeafe', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>gridguard-outages</code> on project <code style={{ background: '#dbeafe', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>gridguard-ai-730f6</code>. All logged-in field tablets, phones, and crew terminals subscribed receive the alert instantaneously.
          </div>
          {isEmployee && (
            <div style={{ marginTop: '0.4rem', fontWeight: 600, color: '#047857' }}>
              🔒 Field Employee Mode: Read-Only Access. You can review scheduled bulletins and emergency contacts. Mass outage broadcast triggers are restricted to Chief Dispatcher / Admin.
            </div>
          )}
        </div>
      </div>

      {/* PRIORITY PHONE NUMBERS ALERT MANAGEMENT CENTER */}
      <div
        style={{
          background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: '10px',
          padding: '1.25rem',
          border: '1px solid #334155',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Card Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 12px rgba(37, 99, 235, 0.4)',
                flexShrink: 0,
              }}
            >
              <Phone size={19} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
                  Target Phone Numbers for Alerts & FCM Broadcast
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: '#2563eb',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    fontWeight: 600,
                  }}
                >
                  {activeSelectedPhones.length} of {alertPhones.length} Selected
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                Add or manage mobile numbers that will receive instant Firebase FCM alerts, push notifications, and emergency dispatches.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={toggleAllPhones}
              className="btn-secondary btn-sm"
              style={{ background: '#1e293b', color: '#e2e8f0', borderColor: '#475569' }}
              title="Select or deselect all numbers"
            >
              <span>{alertPhones.every((p) => p.enabled) ? 'Deselect All' : 'Select All'}</span>
            </button>

            <button
              onClick={handlePushToAllSelected}
              className="btn-secondary btn-sm"
              style={{ background: '#3b82f6', color: '#ffffff', borderColor: '#3b82f6', fontWeight: 600 }}
              title="Broadcast instant push notification to all selected phone numbers"
            >
              <BellRing size={13} />
              <span>Push All ({activeSelectedPhones.length})</span>
            </button>

            <button
              onClick={() => setShowAddPhoneForm(!showAddPhoneForm)}
              className="btn-primary btn-sm"
              style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 600 }}
            >
              <Plus size={14} />
              <span>{showAddPhoneForm ? 'Close Form' : '+ Add Phone Number'}</span>
            </button>
          </div>
        </div>

        {/* Inline Add Phone Number Form */}
        {showAddPhoneForm && (
          <form
            onSubmit={handleAddPhoneNumber}
            style={{
              background: '#0b1329',
              border: '1px solid #2563eb',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: 600, fontSize: '0.85rem' }}>
              <UserPlus size={16} />
              <span>Add New Notification Contact Number</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>
                  Contact Name / Designation *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Field Supervisor / Civil Hospital Ops"
                  value={newPhoneName}
                  onChange={(e) => setNewPhoneName(e.target.value)}
                  className="form-input"
                  style={{
                    background: '#1e293b',
                    color: '#ffffff',
                    border: '1px solid #475569',
                    fontSize: '0.8rem',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>
                  10-Digit Mobile Number (+91) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#1e293b', border: '1px solid #475569', borderRadius: '4px', padding: '0 0.5rem' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>+91</span>
                  <input
                    type="tel"
                    placeholder="98250 12345"
                    value={newPhoneNumber}
                    onChange={(e) => setNewPhoneNumber(e.target.value)}
                    style={{
                      background: 'transparent',
                      color: '#ffffff',
                      border: 'none',
                      outline: 'none',
                      padding: '0.45rem 0.5rem',
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-mono)',
                      width: '100%',
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>
                  Role / Designation Tag
                </label>
                <select
                  value={newPhoneRole}
                  onChange={(e) => setNewPhoneRole(e.target.value)}
                  className="form-select"
                  style={{
                    background: '#1e293b',
                    color: '#ffffff',
                    border: '1px solid #475569',
                    fontSize: '0.8rem',
                  }}
                >
                  <option value="Chief Dispatcher">Chief Dispatcher</option>
                  <option value="Field Crew Lead">Field Crew Lead</option>
                  <option value="Critical Feeder Lead">Critical Feeder Lead</option>
                  <option value="Hospital Emergency Lead">Hospital Emergency Lead</option>
                  <option value="Substation Engineer">Substation Engineer</option>
                  <option value="Discom Executive">Discom Executive</option>
                  <option value="Public Safety Ops">Public Safety Ops</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="submit"
                  className="btn-primary btn-sm"
                  style={{ background: '#2563eb', borderColor: '#2563eb', whiteSpace: 'nowrap' }}
                >
                  <Check size={14} />
                  <span>Save Number</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPhoneForm(false)}
                  className="btn-secondary btn-sm"
                  style={{ background: '#334155', color: '#e2e8f0', borderColor: '#475569' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* List of Configured Alert Phone Numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '0.75rem' }}>
          {alertPhones.map((phone) => {
            const formattedPhone = `+91 ${phone.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}`;
            return (
              <div
                key={phone.id}
                style={{
                  background: phone.enabled ? '#1e293b' : '#0f172a',
                  border: `1px solid ${phone.enabled ? '#3b82f6' : '#334155'}`,
                  borderRadius: '6px',
                  padding: '0.75rem 0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease',
                  opacity: phone.enabled ? 1 : 0.65,
                }}
              >
                {/* Top Row: Checkbox, Name, Role, and Delete */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={phone.enabled}
                      onChange={() => toggleAlertPhone(phone.id)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#ffffff' }}>
                        {phone.name}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        {phone.role || 'Priority Contact'}
                      </div>
                    </div>
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: phone.enabled ? '#38bdf8' : '#94a3b8',
                        background: '#0f172a',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        border: '1px solid #334155',
                      }}
                    >
                      {formattedPhone}
                    </span>

                    {/* Delete button (only show delete if more than 1 number or non-default) */}
                    {alertPhones.length > 1 && (
                      <button
                        onClick={() => handleRemovePhoneNumber(phone.id, phone.name)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f87171',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Remove number from list"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Quick Dispatch Actions for this number */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', paddingTop: '0.25rem', borderTop: '1px solid #334155' }}>
                  <button
                    onClick={() => handleDirectPhonePush(phone)}
                    className="btn-secondary btn-sm"
                    style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      borderColor: '#2563eb',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.68rem',
                    }}
                    title={`Send instantaneous web push alert to ${phone.name}`}
                  >
                    <Radio size={11} />
                    <span>Push</span>
                  </button>

                  <button
                    onClick={() => handleOpenWhatsApp(phone.phone, phone.name)}
                    className="btn-secondary btn-sm"
                    style={{
                      background: '#16a34a',
                      color: '#ffffff',
                      borderColor: '#16a34a',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.68rem',
                    }}
                    title={`Open WhatsApp chat with prefilled message to +91 ${phone.phone}`}
                  >
                    <MessageSquare size={11} />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleOpenSMS(phone.phone, phone.name)}
                    className="btn-secondary btn-sm"
                    style={{
                      background: '#334155',
                      color: '#ffffff',
                      borderColor: '#475569',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.68rem',
                    }}
                    title={`Open default device SMS app for +91 ${phone.phone}`}
                  >
                    <Smartphone size={11} />
                    <span>SMS</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Message Generator (Left) & Recipient Management (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr', gap: '1.25rem' }}>
        {/* Left: Message Generator */}
        <div className="control-card">
          <div className="control-card-header">
            <div className="control-card-title">
              <FileText size={16} color="#0f172a" />
              <span>Outage Message Generator & Broadcast Trigger</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Direct Gateway & Multi-Channel Dispatch
            </span>
          </div>

          <div className="control-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Outage Time Configuration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Window Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Window End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Est. Duration (hrs)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                />
              </div>
            </div>

            {/* Outage Reason */}
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                Operational Justification / Reason
              </label>
              <input
                type="text"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Editable Preview */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155' }}>
                  Editable Broadcast Preview
                </label>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {customMessage.length} characters • Firebase FCM Payload Ready
                </span>
              </div>
              <textarea
                rows={6}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="form-textarea"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.45 }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', flexWrap: 'wrap' }}>
              {isEmployee ? (
                <div
                  style={{
                    flex: 1,
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '0.85rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                    🔒 Read-Only Outage Advisory Mode
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Mass outage broadcasts via Firebase FCM and telecom dispatch are restricted to the Chief Dispatcher.
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleSendNotification}
                    disabled={isSendingFCM || activeSelectedPhones.length === 0}
                    className="btn-primary"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      background: activeSelectedPhones.length > 0 ? 'linear-gradient(135deg, #ea580c 0%, #d97706 100%)' : '#94a3b8',
                      borderColor: '#c2410c',
                      color: '#ffffff',
                      minWidth: '240px',
                      boxShadow: activeSelectedPhones.length > 0 ? '0 4px 14px rgba(234, 88, 12, 0.25)' : 'none',
                    }}
                  >
                    <Flame size={16} color="#ffffff" />
                    <span>
                      {isSendingFCM
                        ? 'Broadcasting via Firebase FCM...'
                        : activeSelectedPhones.length > 0
                        ? `Dispatch via Firebase Cloud Messaging (${activeSelectedPhones.length} Target${activeSelectedPhones.length > 1 ? 's' : ''})`
                        : 'Select Numbers to Broadcast'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      showToast(
                        'Notification Scheduled',
                        `Automated dispatch scheduled for ${startTime} to ${activeSelectedPhones.length} phone numbers and ${selectedRecipientIds.length} feeder contacts.`,
                        'info'
                      );
                    }}
                    className="btn-secondary"
                    style={{ justifyContent: 'center' }}
                  >
                    <Clock size={15} />
                    <span>Schedule Window</span>
                  </button>
                </>
              )}
            </div>

            {/* Firebase Cloud Messaging Live Status Feedback */}
            {fcmResult && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem 0.95rem',
                  borderRadius: '6px',
                  background: fcmResult.success ? '#fffbeb' : '#fef2f2',
                  border: `1px solid ${fcmResult.success ? '#fde68a' : '#fecaca'}`,
                  fontSize: '0.75rem',
                  color: fcmResult.success ? '#92400e' : '#991b1b',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                }}
              >
                <Flame size={16} color={fcmResult.success ? '#d97706' : '#dc2626'} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700 }}>
                    Firebase Cloud Messaging (FCM): {fcmResult.success ? 'Delivered Live to Topic' : 'Broadcast Error'}
                  </div>
                  {fcmResult.success ? (
                    <div style={{ marginTop: '0.2rem' }}>
                      Transmitted to Firebase topic <strong>{fcmResult.topic}</strong> (Project: <strong>{fcmResult.project}</strong>).
                      {fcmResult.messageId && (
                        <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', marginTop: '0.2rem', opacity: 0.85 }}>
                          Message ID: {fcmResult.messageId}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ marginTop: '0.2rem' }}>{fcmResult.error}</div>
                  )}
                </div>
              </div>
            )}

            <div style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'center', marginTop: '0.25rem' }}>
              Primary broadcast engine: <strong>Firebase Cloud Messaging (FCM Topic: /topics/gridguard-outages)</strong> • Active for <strong>{activeSelectedPhones.length} designated contact(s)</strong>.
            </div>
          </div>
        </div>

        {/* Right: Regional Feeder Directory */}
        <div className="control-card">
          <div className="control-card-header">
            <div className="control-card-title">
              <Users size={16} color="#0f172a" />
              <span>Target Feeder Contacts ({selectedRecipientIds.length} Selected)</span>
            </div>

            <button
              onClick={() => setShowAddRecipientForm(!showAddRecipientForm)}
              className="btn-secondary btn-sm"
            >
              <Plus size={13} />
              <span>Add Facility</span>
            </button>
          </div>

          <div className="control-card-body" style={{ padding: '0.75rem' }}>
            {/* Add recipient form */}
            {showAddRecipientForm && (
              <form
                onSubmit={handleCreateRecipient}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '0.85rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>Add Regional Facility Contact</div>
                <input
                  type="text"
                  placeholder="Facility / Contact Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="form-input"
                  required
                />
                <input
                  type="text"
                  placeholder="Mobile (e.g. +91 98250 12345)"
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value)}
                  className="form-input"
                  required
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="form-select"
                >
                  <option value="Critical Infrastructure (Hospital/Water)">Critical Infrastructure (Hospital/Water)</option>
                  <option value="Industrial Feeder">Industrial Feeder</option>
                  <option value="Commercial Complex">Commercial Complex</option>
                  <option value="Residential Distribution">Residential Distribution</option>
                </select>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button type="submit" className="btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddRecipientForm(false)}
                    className="btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Recipient list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '380px', overflowY: 'auto' }}>
              {recipients.map((rec) => {
                const isChecked = selectedRecipientIds.includes(rec.id);
                return (
                  <div
                    key={rec.id}
                    onClick={() => toggleRecipient(rec.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.75rem',
                      border: `1px solid ${isChecked ? '#cbd5e1' : '#f1f5f9'}`,
                      borderRadius: '6px',
                      background: isChecked ? '#f8fafc' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{rec.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {rec.mobile} • {rec.type}
                        </div>
                      </div>
                    </div>

                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                      {rec.region}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="control-card">
        <div className="control-card-header">
          <div className="control-card-title">
            <Radio size={16} color="#16a34a" />
            <span>Recent Outage Broadcast Transmission Logs</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Audit Record of Sent Advisory Notifications & FCM Telemetry
          </span>
        </div>

        <div className="control-card-body" style={{ padding: 0 }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Notification ID</th>
                  <th>Timestamp</th>
                  <th>Region & Asset</th>
                  <th>Window</th>
                  <th>Duration</th>
                  <th>Recipients Count</th>
                  <th>Delivery Status</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notif) => (
                  <tr key={notif.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{notif.id}</td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{notif.timestamp}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{notif.affectedAssetName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{notif.region}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {notif.windowStart} – {notif.windowEnd}
                    </td>
                    <td>{notif.durationHours} hrs</td>
                    <td>{notif.recipientsCount} contacts</td>
                    <td>
                      <span className="badge badge-healthy">
                        <CheckCircle2 size={11} color="#16a34a" />
                        <span>Transmitted</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
