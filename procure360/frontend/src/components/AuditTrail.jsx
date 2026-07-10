import React, { useState, useEffect } from 'react';
import { getAuditLogs, getAuditExportUrl } from '../api';
import { ShieldCheck } from 'lucide-react';

const AuditTrail = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const data = await getAuditLogs();
            setLogs(data.events || []);
        } catch (error) {
            console.error("Failed to fetch audit logs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        window.open(getAuditExportUrl(), '_blank');
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldCheck size={32} />
                        Enterprise Audit Trail
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Immutable log of all actions taken within the Procure360 system.</p>
                </div>
                <button className="btn-primary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6' }}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Export JSONL
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading audit records...</div>
                ) : logs.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No audit events found.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--glass-border)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Timestamp</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Event Type</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Entity ID</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                            {new Date(log.created_at + 'Z').toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ 
                                                background: 'rgba(59, 130, 246, 0.2)', 
                                                color: '#93c5fd', 
                                                padding: '0.25rem 0.75rem', 
                                                borderRadius: '9999px',
                                                fontSize: '0.875rem'
                                            }}>
                                                {log.event_type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{log.entity_id || '-'}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{log.details}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditTrail;
