import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { getRiskAnalytics, api } from '../api';

const SEVERITY_COLORS = {
    HIGH:   '#ef4444',
    MEDIUM: '#f59e0b',
    LOW:    '#3b82f6',
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
        return (
            <div style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: '#e2e8f0',
                fontSize: '0.875rem',
            }}>
                <strong>{payload[0].name || payload[0].payload?.name}</strong>
                <div style={{ color: '#94a3b8', marginTop: '0.2rem' }}>
                    Count: <strong style={{ color: 'white' }}>{payload[0].value}</strong>
                </div>
            </div>
        );
    }
    return null;
};

export default function AnalyticsDashboard() {
    const [severityData, setSeverityData] = useState([]);
    const [flagTypeData, setFlagTypeData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // Severity distribution (existing endpoint)
                const risks = await getRiskAnalytics();
                setSeverityData(risks.map(r => ({ name: r.severity, value: r.count })));

                // Top flag types (new query)
                const flagRes = await api.get('/contracts/analytics/flag-types');
                setFlagTypeData(flagRes.data.slice(0, 7)); // top 7
            } catch {
                // fail gracefully — charts just don't render
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading) return (
        <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                <div className="skeleton" style={{ height: '1.5rem', width: '40%' }} />
                <div className="skeleton" style={{ height: '260px', width: '100%' }} />
            </div>
        </div>
    );

    if (severityData.length === 0) return null;

    return (
        <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
            <div className="section-header">
                <h2 className="section-title">📊 Risk Analytics</h2>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Across all uploaded contracts
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* ── Severity Donut ── */}
                <div>
                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                        Severity Distribution
                    </h4>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={severityData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={4}
                                dataKey="value"
                            >
                                {severityData.map((entry, i) => (
                                    <Cell key={i} fill={SEVERITY_COLORS[entry.name] || '#64748b'} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ color: '#cbd5e1', fontSize: '0.85rem' }}
                                formatter={(val) => <span style={{ color: '#cbd5e1' }}>{val}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* ── Flag Type Bar Chart ── */}
                {flagTypeData.length > 0 && (
                    <div>
                        <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                            Top Flag Types
                        </h4>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart
                                data={flagTypeData}
                                layout="vertical"
                                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                <XAxis
                                    type="number"
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="flag_type"
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={110}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#6366f1" maxBarSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

            </div>

            {/* ── Summary text ── */}
            {severityData.length > 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem', fontSize: '0.85rem' }}>
                    {severityData.find(d => d.name === 'HIGH')?.value ?? 0} high-risk ·{' '}
                    {severityData.find(d => d.name === 'MEDIUM')?.value ?? 0} medium-risk ·{' '}
                    {severityData.find(d => d.name === 'LOW')?.value ?? 0} low-risk flags found across all contracts
                </p>
            )}
        </div>
    );
}
