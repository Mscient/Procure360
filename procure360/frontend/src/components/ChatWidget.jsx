import React, { useState, useRef, useEffect } from 'react';
import { chatWithContract } from '../api';
import { Bot, Send } from 'lucide-react';

// PascalCase export — was 'chatWidget' (lowercase) which silently breaks in React
export default function ChatWidget({ contractId, filename }) {
    const [messages, setMessages] = useState([
        {
            sender: 'ai',
            text: `Hi! I've read "${filename}" in full. Ask me anything — payment terms, liability caps, notice periods, termination clauses...`,
            time: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef(null);

    // Auto-scroll to latest message whenever messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const question = input.trim();

        const userMsg = { sender: 'user', text: question, time: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await chatWithContract(contractId, question);
            setMessages(prev => [
                ...prev,
                { sender: 'ai', text: response.answer, time: new Date() }
            ]);
        } catch (err) {
            setMessages(prev => [
                ...prev,
                { sender: 'ai', text: 'Sorry, I couldn\'t get a response. Please try again.', time: new Date() }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (date) =>
        date?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '';

    const QUICK_QUESTIONS = [
        'What are the payment terms?',
        'What is the liability cap?',
        'Is there a warranty clause?',
        'What is the notice period?',
    ];

    return (
        <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--glass-border)',
            marginTop: '1.5rem',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'rgba(192, 132, 252, 0.05)',
            }}>
                <Bot size={28} style={{ color: '#c084fc' }} />
                <div>
                    <div style={{ fontWeight: '600', color: '#c084fc', fontSize: '0.95rem' }}>
                        AI Contract Assistant
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Powered by Gemini · Context: {filename}
                    </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                    <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Online</span>
                </div>
            </div>

            {/* Quick question chips */}
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {QUICK_QUESTIONS.map((q, i) => (
                    <button
                        key={i}
                        onClick={() => { setInput(q); }}
                        style={{
                            background: 'rgba(192, 132, 252, 0.08)',
                            border: '1px solid rgba(192, 132, 252, 0.2)',
                            borderRadius: '99px',
                            color: '#c084fc',
                            fontSize: '0.75rem',
                            padding: '0.3rem 0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => e.target.style.background = 'rgba(192, 132, 252, 0.18)'}
                        onMouseLeave={e => e.target.style.background = 'rgba(192, 132, 252, 0.08)'}
                    >
                        {q}
                    </button>
                ))}
            </div>

            {/* Message list */}
            <div style={{
                height: '280px',
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
            }}>
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            gap: '0.2rem',
                        }}
                    >
                        <div
                            className={msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
                            style={{
                                padding: '0.75rem 1rem',
                                maxWidth: '85%',
                                fontSize: '0.9rem',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {msg.text}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingInline: '0.25rem' }}>
                            {formatTime(msg.time)}
                        </span>
                    </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem' }}>
                        <div className="chat-bubble-ai" style={{ padding: '0.75rem 1rem' }}>
                            <div className="typing-dots">
                                <span /><span /><span />
                            </div>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingInline: '0.25rem' }}>
                            AI is thinking...
                        </span>
                    </div>
                )}

                {/* Invisible anchor for auto-scroll */}
                <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div style={{
                padding: '0.75rem 1rem',
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                gap: '0.75rem',
            }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Ask about clauses, risks, terms..."
                    className="input-field"
                    style={{ flex: 1 }}
                    disabled={isLoading}
                />
                <button
                    className="btn-primary"
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    style={{ padding: '0.75rem 1.25rem', flexShrink: 0 }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Send size={16} /> Send</span>
                </button>
            </div>
        </div>
    );
}
