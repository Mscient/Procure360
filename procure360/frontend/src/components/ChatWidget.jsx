import React, { useState } from 'react';
import { chatWithContract } from '../api';

export default function chatWidget({ contractId, filename }) {
    const [messages, setMessages] = useState([
        { sender: 'ai', text: `Hi! I have scanned "${filename}". Ask me anything about this contract.` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        // User चा message add करा
        const newMessages = [...messages, { sender: 'user', text: input }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            // API ला Call करा
            const response = await chatWithContract(contractId, input);
            setMessages([...newMessages, { sender: 'ai', text: response.answer }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages([...newMessages, { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ background: '#1e293b', borderRadius: '8px', padding: '1.5rem', marginTop: '1rem', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ color: '#c084fc', marginBottom: '1rem' }}>🤖 Chat with Contract</h4>

            <div style={{ height: '250px', overflowY: 'auto', background: '#0f172a', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        background: msg.sender === 'user' ? 'var(--accent-color)' : '#334155',
                        color: 'white',
                        padding: '0.8rem 1rem',
                        borderRadius: '8px',
                        maxWidth: '80%',
                        fontSize: '0.95rem',
                        lineHeight: '1.4'
                    }}>
                        {msg.text}
                    </div>
                ))}
                {isLoading && (
                    <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        AI is typing... ✍️
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about notice period, liability, etc..."
                    className="input-field"
                    style={{ flex: '1' }}
                />
                <button
                    className="btn-primary"
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                >
                    Send 🚀
                </button>
            </div>
        </div>
    );
}
