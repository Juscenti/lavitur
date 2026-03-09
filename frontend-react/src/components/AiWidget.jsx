import { useState, useRef, useEffect } from 'react';
import '../styles/ai-widget.css';

function getAiApiUrl() {
  if (import.meta.env.VITE_AI_API_BASE) return import.meta.env.VITE_AI_API_BASE.replace(/\/$/, '') + '/api/ai';
  if (typeof window !== 'undefined' && window.AI_API_BASE) return window.AI_API_BASE.replace(/\/$/, '') + '/api/ai';
  return 'http://localhost:5001/api/ai';
}

const WELCOME = "Hello, I'm your personal Lavitúr style consultant. Ask me about our collections, sizing, styling advice, or anything else.";

export default function AiWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const hasOpenedRef = useRef(false);
  const chatBodyRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, sending]);

  useEffect(() => {
    if (open) {
      if (!hasOpenedRef.current) {
        hasOpenedRef.current = true;
        setMessages([{ sender: 'ai', text: WELCOME }]);
      }
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [open]);

  const appendMessage = (sender, text) => {
    setMessages((m) => [...m, { sender, text }]);
  };

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || sending) return;
    appendMessage('user', prompt);
    setInput('');
    setSending(true);
    try {
      const res = await fetch(getAiApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      appendMessage('ai', data.reply || '⚠️ No reply received.');
    } catch (err) {
      appendMessage('ai', '⚠️ AI is currently unavailable. Please try again shortly.');
      console.error('AI Error:', err.message || err);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`ai-launcher${open ? ' ai-launcher--hidden' : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Open Lavitúr AI"
      >
        <span className="ai-launcher-spark">✦</span>
      </button>

      {open && (
        <div className="ai-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <div
        className={`ai-panel${open ? ' ai-panel--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Lavitúr AI Style Consultant"
      >
        <div className="ai-panel-header">
          <div className="ai-panel-header-info">
            <span className="ai-header-spark">✦</span>
            <div>
              <p className="ai-panel-title">LAVITÚR AI</p>
              <p className="ai-panel-subtitle">Style Consultant</p>
            </div>
          </div>
          <button
            type="button"
            className="ai-panel-close"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div ref={chatBodyRef} className="ai-body">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-msg ai-msg--${msg.sender}`}>
              {msg.sender === 'ai' && (
                <span className="ai-msg-avatar" aria-hidden="true">✦</span>
              )}
              <p className="ai-msg-text">{msg.text}</p>
            </div>
          ))}

          {sending && (
            <div className="ai-msg ai-msg--ai">
              <span className="ai-msg-avatar" aria-hidden="true">✦</span>
              <div className="ai-typing" aria-label="AI is typing">
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        <div className="ai-input-row">
          <div className="ai-input-pill">
            <input
              ref={inputRef}
              type="text"
              className="ai-input"
              placeholder="Ask me anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              disabled={sending}
              aria-label="Your message"
            />
          </div>
          <button
            type="button"
            className="ai-send"
            onClick={send}
            disabled={sending || !input.trim()}
            aria-label="Send message"
          >
            <i className="fas fa-paper-plane" />
          </button>
        </div>
      </div>
    </>
  );
}
