import React, { useState, useEffect } from 'react';
import { getVendors, getVendorHistory } from '../api';
import { Building2 } from 'lucide-react';
import { useToast } from './ToastContext';
import BidScoresChart from './BidScoresChart';

export default function Vendors() {
    const toast = useToast();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);

    const [expandedVendor, setExpandedVendor] = useState(null);
    const [historyData, setHistoryData] = useState({});
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const res = await getVendors();
            setVendors(res.vendors || []);
        } catch (err) {
            toast.error("Failed to load vendor profiles.");
        } finally {
            setLoading(false);
        }
    };

    const handleViewHistory = async (vendorName) => {
        if (expandedVendor === vendorName) {
            setExpandedVendor(null);
            return;
        }

        if (!historyData[vendorName]) {
            setLoadingHistory(true);
            try {
                const res = await getVendorHistory(vendorName);
                setHistoryData(prev => ({ ...prev, [vendorName]: res.history }));
            } catch (err) {
                toast.error(`Failed to load history for ${vendorName}`);
                setLoadingHistory(false);
                return;
            }
            setLoadingHistory(false);
        }
        setExpandedVendor(vendorName);
    };

    return (
        <div style={{ padding: '0.5rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                    <Building2 size={32} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '8px' }} /> Vendor Profiles
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Track vendor performance, win rates, and bid history across all procurement events.
                </p>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div className="section-header">
                    <h2 className="section-title">All Vendors</h2>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} extracted from bids
                    </span>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton skeleton-text-full" style={{ height: '3rem' }} />
                        ))}
                    </div>
                ) : vendors.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><Building2 size={48} /></div>
                        <div className="empty-text">No vendors found. Upload some bids to populate profiles.</div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Vendor Name</th>
                                <th>Times Bid</th>
                                <th>Batches Participated</th>
                                <th>Lowest Price Offered</th>
                                <th>Last Seen</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.map(v => (
                                <React.Fragment key={v.vendor_name}>
                                    <tr>
                                        <td style={{ fontWeight: '600', color: 'var(--accent-color)' }}>
                                            {v.vendor_name}
                                        </td>
                                        <td>{v.times_bid}</td>
                                        <td>{v.batches_participated}</td>
                                        <td>
                                            {v.min_price ? `$${v.min_price.toLocaleString()}` : '—'}
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            {v.last_seen ? new Date(v.last_seen).toLocaleDateString() : '—'}
                                        </td>
                                        <td>
                                            <button
                                                className={expandedVendor === v.vendor_name ? 'btn-secondary' : 'btn-primary'}
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                                onClick={() => handleViewHistory(v.vendor_name)}
                                            >
                                                {expandedVendor === v.vendor_name ? 'Hide History' : 'View History'}
                                            </button>
                                        </td>
                                    </tr>

                                    {/* ── Expanded History Panel ── */}
                                    {expandedVendor === v.vendor_name && (
                                        <tr>
                                            <td colSpan="6" style={{ padding: 0, border: 'none' }}>
                                                <div style={{
                                                    background: '#f8fafc',
                                                    padding: '1.5rem',
                                                    borderLeft: '3px solid var(--accent-purple)',
                                                    margin: '0 0 1rem 0'
                                                }}>
                                                    <h4 style={{ marginBottom: '1rem', color: 'var(--accent-purple)' }}>
                                                        Bid History for {v.vendor_name}
                                                    </h4>

                                                    {loadingHistory && !historyData[v.vendor_name] ? (
                                                        <div className="skeleton skeleton-text" />
                                                    ) : (
                                                        <table className="data-table" style={{ background: '#ffffff' }}>
                                                            <thead>
                                                                <tr>
                                                                    <th style={{ fontSize: '0.75rem' }}>Date</th>
                                                                    <th style={{ fontSize: '0.75rem' }}>Batch ID</th>
                                                                    <th style={{ fontSize: '0.75rem' }}>Price</th>
                                                                    <th style={{ fontSize: '0.75rem' }}>Lead Time</th>
                                                                    <th style={{ fontSize: '0.75rem' }}>Payment Terms</th>
                                                                    <th style={{ fontSize: '0.75rem' }}>Warranty</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {historyData[v.vendor_name]?.map(bid => (
                                                                    <tr key={bid.bid_id}>
                                                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                                            {new Date(bid.uploaded_at).toLocaleDateString()}
                                                                        </td>
                                                                        <td>
                                                                            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                                                {bid.batch_id.split('-')[0]}...
                                                                            </span>
                                                                        </td>
                                                                        <td style={{ fontWeight: '500' }}>
                                                                            {bid.price ? `$${bid.price.toLocaleString()}` : '—'}
                                                                        </td>
                                                                        <td>{bid.lead_time || '—'}</td>
                                                                        <td>{bid.payment_terms || '—'}</td>
                                                                        <td>{bid.warranty_terms || '—'}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
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
        </div>
    );
}
