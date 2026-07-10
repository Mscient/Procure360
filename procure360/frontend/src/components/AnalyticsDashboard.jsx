import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getRiskAnalytics } from '../api';

const COLORS = {
  HIGH: '#ef4444',     // Red
  MEDIUM: '#f59e0b',   // Yellow
  LOW: '#3b82f6'       // Blue
};

export default function AnalyticsDashboard() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const risks = await getRiskAnalytics();
                // Map to chart format
                const chartData = risks.map(r => ({
                    name: r.severity,
                    value: r.count
                }));
                setData(chartData);
            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading analytics...</div>;
    if (data.length === 0) return null;

    return (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#60a5fa' }}>📊 Global Risk Distribution</h2>
            <div style={{ display: 'flex', justifyContent: 'center', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.9rem' }}>
                This chart shows the total distribution of AI-scanned risk flags across all uploaded contracts.
            </p>
        </div>
    );
}
