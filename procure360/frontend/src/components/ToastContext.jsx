import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

/**
 * useToast() — call this in any component to fire toasts.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success('Contract uploaded!');
 *   toast.error('Upload failed: ' + err.message);
 *   toast.info('Batch ID copied to clipboard');
 *   toast.warning('Contract expires in 7 days');
 */
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
}

let _nextId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((type, message, durationMs = 4000) => {
        const id = ++_nextId;
        setToasts(prev => [...prev, { id, type, message, dismissing: false }]);

        // Auto-dismiss
        setTimeout(() => dismiss(id), durationMs);
    }, []);

    const dismiss = useCallback((id) => {
        // Mark as dismissing (plays out animation)
        setToasts(prev =>
            prev.map(t => t.id === id ? { ...t, dismissing: true } : t)
        );
        // Remove after animation completes
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 300);
    }, []);

    const toast = {
        success: (msg, ms) => addToast('success', msg, ms),
        error:   (msg, ms) => addToast('error',   msg, ms),
        info:    (msg, ms) => addToast('info',    msg, ms),
        warning: (msg, ms) => addToast('warning', msg, ms),
    };

    const ICONS = {
        success: <CheckCircle2 size={18} />,
        error:   <XCircle size={18} />,
        info:    <Info size={18} />,
        warning: <AlertTriangle size={18} />,
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}

            {/* Toast stack — top-right corner */}
            <div className="toast-container">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`toast toast-${t.type}${t.dismissing ? ' dismissing' : ''}`}
                        onClick={() => dismiss(t.id)}
                        title="Click to dismiss"
                    >
                        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{ICONS[t.type]}</span>
                        <span className="toast-message">{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
