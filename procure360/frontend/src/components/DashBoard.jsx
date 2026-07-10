import React, { useState, useEffect } from 'react';
import { api, getContractFlags, getStatsSummary, updateContractStatus } from '../api';
import { FileText, AlertTriangle, Handshake, Scale, LayoutDashboard, FolderOpen, XCircle, Search, CheckCircle2, BrainCircuit, ScanSearch, Trophy, Circle, CircleDashed } from 'lucide-react';
import ChatWidget from './ChatWidget';
import AnalyticsDashboard from './AnalyticsDashboard';
import BidScoresChart from './BidScoresChart';
import { useToast } from './ToastContext';

export default function Dashboard() {
    const toast = useToast();

    // ── Contracts ──
    const [contracts, setContracts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedContractId, setExpandedContractId] = useState(null);
    const [contractFlags, setContractFlags] = useState({});

    // ── Bids ──
    const [batchId, setBatchId] = useState('');
    const [rankedBids, setRankedBids] = useState([]);
    const [loadingBids, setLoadingBids] = useState(false);

    // ── Stats ──
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // ── Load on mount ──────────────────────────────────────────────────
    useEffect(() => {
        fetchContracts();
        fetchStats();
    }, []);

    const fetchContracts = async () => {
        try {
            const response = await api.get('/contracts/');
            setContracts(response.data);
        } catch {
            toast.error('Failed to load contracts');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await getStatsSummary();
            setStats(data);
        } catch {
            // stats are non-critical — fail silently
        } finally {
            setStatsLoading(false);
        }
    };

    // ── Handlers ───────────────────────────────────────────────────────
    const handleCompareBids = async () => {
        if (!batchId.trim()) return;
        setLoadingBids(true);
        try {
            const response = await api.get(`/bids/compare/${batchId.trim()}`);
            setRankedBids(response.data.ranked_bids);
            toast.success(`Ranked ${response.data.ranked_bids.length} bids successfully`);
        } catch {
            toast.error('Batch ID not found — check the ID and try again');
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
            } catch {
                toast.error('Failed to fetch risk flags');
                return;
            }
        }
        setExpandedContractId(contractId);
    };

    const handleStatusChange = async (contractId, newStatus) => {
        try {
            await updateContractStatus(contractId, newStatus);
            setContracts(prev =>
                prev.map(c => c.id === contractId ? { ...c, status: newStatus } : c)
            );
            toast.success(`Contract marked as "${newStatus}"`);
            fetchStats(); // refresh KPI count
        } catch {
            toast.error('Failed to update contract status');
        }
    };

    // ── Contract lifecycle helpers ──────────────────────────────────────
    const getContractStatus = (contract) => {
        if (contract.status === 'expired') return 'expired';
        if (contract.status === 'draft')   return 'draft';
        if (contract.expires_at) {
            const daysLeft = Math.ceil(
                (new Date(contract.expires_at) - new Date()) / (1000 * 60 * 60 * 24)
            );
            if (daysLeft <= 0)  return 'expired';
            if (daysLeft <= 30) return 'expiring';
        }
        return 'active';
    };

    const StatusBadge = ({ contract }) => {
        const status = getContractStatus(contract);
        const MAP = {
            active:   { cls: 'badge-active',   label: <><Circle size={12} fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Active</> },
            expiring: { cls: 'badge-expiring',  label: <><AlertTriangle size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Expiring Soon</> },
            expired:  { cls: 'badge-expired',   label: <><XCircle size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Expired</> },
            draft:    { cls: 'badge-draft',     label: <><CircleDashed size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Draft</> },
        };
        const { cls, label } = MAP[status] || MAP.draft;
        return <span className={`badge ${cls}`} style={{ fontSize: '0.75rem' }}>{label}</span>;
    };

    // ── KPI Cards data ──────────────────────────────────────────────────
    const KPI_CARDS = [
        {
            icon: <FileText size={32} />,
            label: 'Total Contracts',
            value: stats?.total_contracts ?? '—',
            sub: 'uploaded and scanned',
            color: '#2563eb',
        },
        {
            icon: <AlertTriangle size={32} />,
            label: 'High-Risk Flags',
            value: stats?.high_risk_flags ?? '—',
            sub: `of ${stats?.total_flags ?? '—'} total flags`,
            color: '#dc2626',
        },
        {
            icon: <Handshake size={32} />,
            label: 'Bids Processed',
            value: stats?.bids_processed ?? '—',
            sub: 'across all batches',
            color: '#4f46e5',
        },
        {
            icon: <Scale size={32} />,
            label: 'Disputes Filed',
            value: stats?.disputes_filed ?? '—',
            sub: 'requiring review',
            color: '#d97706',
        },
    ];

    return (
        <div style={{ padding: '0.5rem' }}>

            {/* ── Page Title ── */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                    <LayoutDashboard size={32} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '8px' }} /> Dashboard
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Live overview of your procurement intelligence — contracts, bids, and risk analytics.
                </p>
            </div>

            {/* ── KPI Stat Cards ── */}
            <div className="stats-grid">
                {KPI_CARDS.map((card, i) => (
                    <div key={i} className="stat-card" style={{ '--stat-color': card.color }}>
                        {statsLoading ? (
                            <>
                                <div className="skeleton skeleton-value" />
                                <div className="skeleton skeleton-text" />
                            </>
                        ) : (
                            <>
                                <span className="stat-icon">{card.icon}</span>
                                <span className="stat-value" style={{ color: card.color }}>{card.value}</span>
                                <span className="stat-label">{card.label}</span>
                                <span className="stat-sub">{card.sub}</span>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* ── Risk Analytics Chart ── */}
            <AnalyticsDashboard />

            {/* ── Contracts Table ── */}
            <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
                <div className="section-header">
                    <h2 className="section-title"><FolderOpen size={24} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '6px' }} /> Uploaded Contracts</h2>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {contracts.length} contract{contracts.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                                <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                                <div className="skeleton skeleton-text" style={{ width: '25%' }} />
                                <div className="skeleton skeleton-text" style={{ width: '15%' }} />
                            </div>
                        ))}
                    </div>
                ) : contracts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><FileText size={48} /></div>
                        <div className="empty-text">No contracts yet — upload one to get started</div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Filename</th>
                                <th>Status</th>
                                <th>Expires</th>
                                <th>Uploaded</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contracts.map((contract) => {
                                const status = getContractStatus(contract);
                                const isExpiring = status === 'expiring';
                                return (
                                    <React.Fragment key={contract.id}>
                                        <tr style={{ background: isExpiring ? 'rgba(245,158,11,0.04)' : '' }}>
                                            <td>
                                                <strong>{contract.filename}</strong>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <StatusBadge contract={contract} />
                                                    {/* Status quick-change */}
                                                    <select
                                                        value={contract.status || 'active'}
                                                        onChange={(e) => handleStatusChange(contract.id, e.target.value)}
                                                        style={{
                                                            background: '#ffffff',
                                                            border: '1px solid var(--glass-border)',
                                                            color: 'var(--text-primary)',
                                                            borderRadius: '6px',
                                                            padding: '0.2rem 0.4rem',
                                                            fontSize: '0.75rem',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <option value="draft">Draft</option>
                                                        <option value="active">Active</option>
                                                        <option value="expired">Expired</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td style={{ color: isExpiring ? 'var(--warning)' : 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                {contract.expires_at || '—'}
                                                {isExpiring && <AlertTriangle size={14} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginLeft: '4px' }} />}
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                {new Date(contract.uploaded_at).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <button
                                                    className={expandedContractId === contract.id ? 'btn-secondary' : 'btn-primary'}
                                                    style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                                                    onClick={() => handleViewFlags(contract.id)}
                                                >
                                                    {expandedContractId === contract.id ? <><XCircle size={16} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Close</> : <><Search size={16} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px' }} /> View Risks & Chat</>}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* ── Expanded panel: flags + chat ── */}
                                        {expandedContractId === contract.id && contractFlags[contract.id] && (
                                            <tr>
                                                <td colSpan="5" style={{ padding: 0, border: 'none' }}>
                                                    <div style={{
                                                        background: '#f8fafc',
                                                        padding: '1.5rem',
                                                        borderLeft: '3px solid var(--accent-color)',
                                                        margin: '0 0 0.5rem 0',
                                                    }}>
                                                        <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            Risk Flags — {contractFlags[contract.id].length} found
                                                        </h4>

                                                        {contractFlags[contract.id].length === 0 ? (
                                                            <p style={{ color: 'var(--success)' }}><CheckCircle2 size={16} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px' }} /> No risks detected in this contract</p>
                                                        ) : (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                                                {contractFlags[contract.id].map((flag, idx) => (
                                                                    <div key={idx} className={`flag-card ${flag.severity}`}>
                                                                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                                                                            <strong style={{
                                                                                color: flag.severity === 'HIGH' ? 'var(--danger)' : flag.severity === 'MEDIUM' ? 'var(--warning)' : 'var(--accent-color)',
                                                                                fontSize: '0.8rem',
                                                                            }}>
                                                                                {flag.severity}
                                                                            </strong>
                                                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{flag.flag_type}</span>
                                                                        </div>
                                                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.3rem', fontStyle: 'italic' }}>
                                                                            "{flag.clause_text}"
                                                                        </p>
                                                                        <p style={{ color: 'var(--text-primary)', fontSize: '0.825rem' }}>
                                                                            {flag.reason}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <ChatWidget contractId={contract.id} filename={contract.filename} />
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Bid Comparison Section ── */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div className="section-header">
                    <h2 className="section-title"><BrainCircuit size={24} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '6px' }} /> AI Bid Comparison</h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    Paste a Batch ID from the Upload page. AI ranks vendors across 5 factors: price, lead time, payment terms, warranty, and price hold.
                </p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Paste Batch ID here..."
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCompareBids()}
                        style={{ flex: '1', minWidth: '280px' }}
                    />
                    <button
                        className="btn-primary"
                        onClick={handleCompareBids}
                        disabled={loadingBids || !batchId.trim()}
                        style={{ flexShrink: 0 }}
                    >
                        {loadingBids ? <><ScanSearch size={18} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Analyzing...</> : <><Trophy size={18} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Run AI Compare</>}
                    </button>
                </div>

                {rankedBids.length > 0 && (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Vendor</th>
                                        <th>Score</th>
                                        <th>Price</th>
                                        <th>Lead Time</th>
                                        <th>AI Verdict</th>
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
                                            <td style={{ fontWeight: '500' }}>{bid.vendor_name}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <strong style={{ fontSize: '1.1rem', color: bid.rank === 1 ? 'var(--success)' : 'var(--text-primary)' }}>
                                                        {bid.score}
                                                    </strong>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>/10</span>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>
                                                {bid.price ? `$${bid.price.toLocaleString()}` : '—'}
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>
                                                {bid.lead_time || '—'}
                                            </td>
                                            <td>
                                                <pre style={{
                                                    whiteSpace: 'pre-wrap',
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '0.8rem',
                                                    lineHeight: '1.5',
                                                    fontFamily: 'inherit',
                                                    maxWidth: '320px',
                                                }}>
                                                    {bid.explanation}
                                                </pre>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <BidScoresChart rankedBids={rankedBids} />
                    </>
                )}
            </div>
        </div>
    );
}
