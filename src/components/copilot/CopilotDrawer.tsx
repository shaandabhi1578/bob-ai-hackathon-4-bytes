import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  ArrowRight,
  ShieldAlert,
  Bot,
  User,
  Zap,
} from 'lucide-react';
import { useGrid } from '../../context/GridContext';

export const CopilotDrawer: React.FC = () => {
  const {
    isCopilotOpen,
    setIsCopilotOpen,
    copilotMessages,
    sendCopilotQuery,
    setActiveTab,
    setSelectedAssetId,
  } = useGrid();

  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isCopilotOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [copilotMessages, isCopilotOpen]);

  if (!isCopilotOpen) return null;

  const quickPrompts = [
    'Why is T-104 critical?',
    'Which crew is closest to T-104?',
    'What is the most dangerous asset right now?',
    'Which areas are likely to experience outages tomorrow?',
    'How many customers could be affected?',
    'What maintenance should we perform today?',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sendCopilotQuery(inputVal.trim());
    setInputVal('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '420px',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e2e8f0',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Copilot Header */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={16} color="#38bdf8" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
              GridGuard Copilot
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              Grounded AI Grid Operations Assistant
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCopilotOpen(false)}
          className="icon-btn"
          style={{ width: '28px', height: '28px' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid #f1f5f9',
          background: '#ffffff',
        }}
      >
        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          Operational Queries:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {quickPrompts.slice(0, 4).map((q, i) => (
            <button
              key={i}
              onClick={() => sendCopilotQuery(q)}
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.55rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#334155',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Message Stream */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {copilotMessages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.68rem',
                  color: '#94a3b8',
                  marginBottom: '0.2rem',
                }}
              >
                <span>{isUser ? 'Dispatcher' : 'GridGuard AI'}</span>
                <span>• {msg.timestamp}</span>
              </div>

              <div
                style={{
                  maxWidth: '92%',
                  padding: '0.75rem 0.9rem',
                  borderRadius: isUser ? '8px 8px 0px 8px' : '8px 8px 8px 0px',
                  background: isUser ? '#0f172a' : '#f8fafc',
                  color: isUser ? '#ffffff' : '#0f172a',
                  border: isUser ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  fontSize: '0.8rem',
                  lineHeight: 1.45,
                  whiteSpace: 'pre-line',
                }}
              >
                {msg.text}

                {/* Optional actionable deep link */}
                {msg.actionRecommendation && (
                  <div style={{ marginTop: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                    <button
                      onClick={() => {
                        if (msg.actionRecommendation?.targetAssetId) {
                          setSelectedAssetId(msg.actionRecommendation.targetAssetId);
                        }
                        setActiveTab(msg.actionRecommendation!.targetTab);
                        setIsCopilotOpen(false);
                      }}
                      className="btn-primary btn-sm"
                      style={{ fontSize: '0.74rem', width: '100%', justifyContent: 'center' }}
                    >
                      <span>{msg.actionRecommendation.label}</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: '0.5rem',
          background: '#ffffff',
        }}
      >
        <input
          type="text"
          placeholder="Ask Copilot about assets, crews, storm..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          className="form-input"
          style={{ height: '38px', fontSize: '0.82rem' }}
        />
        <button type="submit" className="btn-primary" style={{ padding: '0 0.85rem' }}>
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
