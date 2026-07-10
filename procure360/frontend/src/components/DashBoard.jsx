import React, { useState, useEffect } from 'react';
import { api, getContractFlags } from '../api';
import ChatWidget from './chatWidget';
import AnalyticsDashboard from './AnalyticsDashboard';
import BidScoresChart from './BidScoresChart';
export default function Dashboard() {
    const [contracts, setContracts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Bids State
    const [batchId, setBatchId] = useState("");
    const [rankedBids, setRankedBids] = useState([]);
    const [loadingBids, setLoadingBids] = useState(false);

    // Contract Flags & Chat State
    const [expandedContractId, setExpandedContractId] = useState(null);
    const [contractFlags, setContractFlags] = useState({});

    useEffect(() => {
        const fetchcontracts = async () => {
            try {
                const response = await api.get('/contracts/');
                setContracts(response.data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchcontracts();
    }, []);

    const handleCompareBids = async () => {
        if (!batchId) return;
        setLoadingBids(true);
        try {
            const response = await api.get(`/bids/compare/${batchId}`);
            setRankedBids(response.data.ranked_bids);
        } catch (error) {
            console.error(error);
            alert("Error: Batch ID not found!");
        } finally {
            setLoadingBids(false);
        }
    };

    const handleViewFlags = async (contractId) => {
        if (expandedContractId === contractId) {
            setExpandedContractId(null);
            return;
        }

        if (!contractFlags[contractId]) {
            try {
                const data = await getContractFlags(contractId);
                setContractFlags(prev => ({ ...prev, [contractId]: data.flags }));
            } catch (error) {
                console.error(error);
                alert("Failed to fetch flags");
            }
        }
        setExpandedContractId(contractId);
    };

    return (
        <div style={{ padding: '1rem' }}>

            {/* 📊 Global Analytics Section */}
            <AnalyticsDashboard />

            {/* 📂 Contracts Section */}
            <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>📂 Uploaded Contracts</h2>
                {isLoading ? <p>Loading...</p> : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Filename</th>
                                <th>Upload Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contracts.map((contract) => (
                                <React.Fragment key={contract.id}>
                                    <tr>
                                        <td><strong>{contract.filename}</strong></td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{new Date(contract.uploaded_at).toLocaleString()}</td>
                                        <td>
                                            <button
                                                className="btn-primary"
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: expandedContractId === contract.id ? '#475569' : '' }}
                                                onClick={() => handleViewFlags(contract.id)}
                                            >
                                                {expandedContractId === contract.id ? "Close Panel" : "View Risks & Chat 🔍"}
                                            </button>
                                        </td>
                                    </tr>

                                    {/* 🎯 Expanded Panel: Risk Flags + Chatbot */}
                                    {expandedContractId === contract.id && contractFlags[contract.id] && (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '0', border: 'none' }}>
                                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderLeft: '4px solid var(--accent-color)', margin: '0 0 1rem 0' }}>

                                                    {/* Risk Flags */}
                                                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Scanned Risk Flags: {contractFlags[contract.id].length}</h4>
                                                    {contractFlags[contract.id].length === 0 ? (
                                                        <p style={{ color: 'var(--success)' }}>No risks found! 🎉</p>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                                            {contractFlags[contract.id].map((flag, idx) => (
                                                                <div key={idx} style={{
                                                                    background: flag.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.1)' : flag.severity === 'MEDIUM' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                                    borderLeft: `4px solid ${flag.severity === 'HIGH' ? 'var(--danger)' : flag.severity === 'MEDIUM' ? 'var(--warning)' : 'var(--accent-color)'}`,
                                                                    padding: '1rem',
                                                                    borderRadius: '4px'
                                                                }}>
                                                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                                                                        <strong style={{ color: flag.severity === 'HIGH' ? 'var(--danger)' : flag.severity === 'MEDIUM' ? 'var(--warning)' : 'var(--accent-color)' }}>
                                                                            {flag.severity}
                                                                        </strong>
                                                                        <span style={{ color: 'var(--text-primary)' }}>{flag.flag_type}</span>
                                                                    </div>
                                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>"{flag.clause_text}"</p>
                                                                    <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontStyle: 'italic' }}>Reason: {flag.source_location}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* 🤖 Chat Widget */}
                                                    <ChatWidget contractId={contract.id} filename={contract.filename} />

                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 🧠 Bid Comparison Section */}
            <div className="glass-panel">
                <h2 style={{ marginBottom: '0.5rem', color: '#c084fc' }}>🧠 AI Bid Comparison</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Enter a Batch ID to let AI rank the vendors.</p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Paste Batch ID here..."
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        style={{ width: '350px' }}
                    />
                    <button className="btn-primary" onClick={handleCompareBids} disabled={loadingBids}>
                        {loadingBids ? "Analyzing Data..." : "Run AI Compare"}
                    </button>
                </div>

                {rankedBids.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Vendor Name</th>
                                    <th>Final Score</th>
                                    <th>AI Explanation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankedBids.map((bid) => (
                                    <tr key={bid.bid_id}>
                                        <td>
                                            <span className={`rank-badge ${bid.rank === 1 ? 'rank-1' : 'rank-other'}`}>
                                                #{bid.rank}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '1.1rem', fontWeight: '500' }}>{bid.vendor_name}</td>
                                        <td>
                                            <strong style={{ fontSize: '1.2rem' }}>{bid.score}</strong> <span style={{ color: 'var(--text-secondary)' }}>/ 10</span>
                                        </td>
                                        <td style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                            {bid.explanation}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 📊 Visual Chart for Bids */}
                {rankedBids.length > 0 && <BidScoresChart rankedBids={rankedBids} />}
            </div>
        </div>
    );
}
