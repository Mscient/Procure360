import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function BidScoresChart({ rankedBids }) {
    if (!rankedBids || rankedBids.length === 0) return null;

    // Sort by score ascending so the best is on top if it's horizontal, but we will do vertical
    const data = [...rankedBids].sort((a, b) => b.score - a.score);

    return (
        <div style={{ marginTop: '2rem', height: '350px', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <h3 style={{ color: '#c084fc', marginBottom: '1rem', textAlign: 'center' }}>Vendor Score Comparison</h3>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                        dataKey="vendor_name" 
                        tick={{ fill: '#cbd5e1', fontSize: 12 }} 
                        axisLine={{ stroke: '#475569' }} 
                        tickLine={{ stroke: '#475569' }} 
                    />
                    <YAxis 
                        domain={[0, 10]} 
                        tick={{ fill: '#cbd5e1' }} 
                        axisLine={{ stroke: '#475569' }} 
                        tickLine={{ stroke: '#475569' }} 
                    />
                    <Tooltip 
                        contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#6366f1'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
