import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileSignature, Handshake, FolderOpen, FileCheck, FolderUp, Archive, ScanSearch, Upload, AlertTriangle, CheckCircle2, BrainCircuit, Copy, LayoutDashboard } from 'lucide-react';
import { uploadContract, uploadBids, uploadBidsCsv } from '../api';
import { useToast } from './ToastContext';

export default function FileUpload() {
    const toast = useToast();
    const navigate = useNavigate();

    // ── Contract state ──
    const [contractFile, setContractFile] = useState(null);
    const [contractDragging, setContractDragging] = useState(false);
    const [contractUploading, setContractUploading] = useState(false);
    const [contractProgress, setContractProgress] = useState(0);
    const [contractResult, setContractResult] = useState(null);
    const contractInputRef = useRef();

    // ── Bids state ──
    const [bidFiles, setBidFiles] = useState(null);
    const [bidDragging, setBidDragging] = useState(false);
    const [bidsUploading, setBidsUploading] = useState(false);
    const [bidsProgress, setBidsProgress] = useState(0);
    const [bidsResult, setBidsResult] = useState(null);
    const bidInputRef = useRef();

    // ── Helpers ──────────────────────────────────────────────────────────

    const simulateProgress = (setProgress, durationMs = 2000) => {
        setProgress(0);
        const steps = 20;
        const interval = durationMs / steps;
        let step = 0;
        const timer = setInterval(() => {
            step++;
            setProgress(Math.min(95, (step / steps) * 100));
            if (step >= steps) clearInterval(timer);
        }, interval);
        return timer;
    };

    const stopProgress = (timer, setProgress) => {
        clearInterval(timer);
        setProgress(100);
        setTimeout(() => setProgress(0), 800);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.info('Batch ID copied to clipboard!');
    };

    // ── Contract handlers ─────────────────────────────────────────────────

    const handleContractDrop = (e) => {
        e.preventDefault();
        setContractDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.pdf')) {
            setContractFile(file);
        } else {
            toast.error('Please drop a PDF file.');
        }
    };

    const handleContractUpload = async () => {
        if (!contractFile) return;
        setContractUploading(true);
        const timer = simulateProgress(setContractProgress, 3000);
        try {
            const result = await uploadContract(contractFile);
            stopProgress(timer, setContractProgress);
            setContractResult(result);
            setContractFile(null);
            toast.success(`✅ Contract scanned — ${result.flags_found} risk flag(s) found`);
        } catch (err) {
            stopProgress(timer, setContractProgress);
            toast.error(`Upload failed: ${err.response?.data?.detail || err.message}`);
        } finally {
            setContractUploading(false);
        }
    };

    // ── Bids handlers ─────────────────────────────────────────────────────

    const handleBidsDrop = (e) => {
        e.preventDefault();
        setBidDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.pdf') || f.name.endsWith('.csv') || f.name.endsWith('.xlsx'));
        if (files.length) {
            setBidFiles(files);
        } else {
            toast.error('Please drop PDF or CSV files only.');
        }
    };

    const handleBidsUpload = async () => {
        if (!bidFiles || bidFiles.length === 0) return;
        setBidsUploading(true);
        const timer = simulateProgress(setBidsProgress, 4000);
        try {
            let result;
            const isCsv = bidFiles[0].name.endsWith('.csv') || bidFiles[0].name.endsWith('.xlsx');
            if (isCsv) {
                result = await uploadBidsCsv(bidFiles[0]);
            } else {
                result = await uploadBids(bidFiles);
            }
            stopProgress(timer, setBidsProgress);
            setBidsResult(result);
            setBidFiles(null);
            toast.success(`🎯 ${result.count} bid(s) processed — ready to compare!`);
        } catch (err) {
            stopProgress(timer, setBidsProgress);
            toast.error(`Upload failed: ${err.response?.data?.detail || err.message}`);
        } finally {
            setBidsUploading(false);
        }
    };

    // ── Severity helpers ──────────────────────────────────────────────────
    const SEVERITY_COLORS = {
        HIGH:   { bg: 'rgba(239,68,68,0.08)',   border: '#ef4444', text: '#f87171' },
        MEDIUM: { bg: 'rgba(245,158,11,0.08)',  border: '#f59e0b', text: '#fbbf24' },
        LOW:    { bg: 'rgba(59,130,246,0.08)',  border: '#3b82f6', text: '#93c5fd' },
    };

    return (
        <div style={{ padding: '0.5rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                    <UploadCloud size={32} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '8px' }} /> Upload Documents
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Upload contracts for AI risk scanning, or vendor bids for intelligent ranking.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>

                {/* ── CONTRACT UPLOAD ── */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}><FileSignature size={24} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '6px' }} /> Master Contract</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Upload a PDF contract and Gemini AI will scan it for risky clauses.
                    </p>

                    {/* Drop Zone */}
                    <div
                        className={`drop-zone ${contractDragging ? 'active' : ''}`}
                        onClick={() => contractInputRef.current?.click()}
                        onDragEnter={(e) => { e.preventDefault(); setContractDragging(true); }}
                        onDragOver={(e) => e.preventDefault()}
                        onDragLeave={() => setContractDragging(false)}
                        onDrop={handleContractDrop}
                    >
                        <div className="drop-icon">
                            {contractFile ? <FileCheck size={48} /> : <FolderOpen size={48} />}
                        </div>
                        {contractFile ? (
                            <>
                                <div className="drop-label" style={{ color: '#60a5fa' }}>{contractFile.name}</div>
                                <div className="drop-hint">{(contractFile.size / 1024).toFixed(1)} KB — Click to change</div>
                            </>
                        ) : (
                            <>
                                <div className="drop-label">Drop your PDF here</div>
                                <div className="drop-hint">or click to browse files</div>
                            </>
                        )}
                        <input
                            ref={contractInputRef}
                            type="file"
                            accept=".pdf"
                            style={{ display: 'none' }}
                            onChange={(e) => setContractFile(e.target.files[0])}
                        />
                    </div>

                    {/* Progress */}
                    {contractUploading && (
                        <div className="progress-bar-track">
                            <div className="progress-bar-fill" style={{ width: `${contractProgress}%` }} />
                        </div>
                    )}

                    <button
                        className="btn-primary"
                        onClick={handleContractUpload}
                        disabled={contractUploading || !contractFile}
                        style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
                    >
                        {contractUploading ? <><ScanSearch size={18} style={{ marginRight: '6px' }} /> Scanning Contract...</> : <><Upload size={18} style={{ marginRight: '6px' }} /> Upload & Scan</>}
                    </button>

                    {/* Results */}
                    {contractResult && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <h4 style={{ color: contractResult.flags_found > 0 ? 'var(--danger)' : 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {contractResult.flags_found > 0
                                        ? <><AlertTriangle size={20} /> {contractResult.flags_found} Risk Flag(s) Found</>
                                        : <><CheckCircle2 size={20} /> No Risks Detected</>}
                                </h4>
                                <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
                                    {contractResult.filename}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                                {contractResult.flags.map((flag, i) => {
                                    const colors = SEVERITY_COLORS[flag.severity] || SEVERITY_COLORS.LOW;
                                    return (
                                        <div key={i} className={`flag-card ${flag.severity}`}>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                                                <span style={{ color: colors.text, fontWeight: '700', fontSize: '0.8rem' }}>
                                                    {flag.severity}
                                                </span>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                    {flag.flag_type}
                                                </span>
                                            </div>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.3rem', fontStyle: 'italic' }}>
                                                "{flag.clause_text}"
                                            </p>
                                            <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                                                {flag.reason}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── BIDS UPLOAD ── */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}><Handshake size={24} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '6px' }} /> Vendor Bids</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Upload multiple PDFs, or a single CSV/Excel export. We'll extract and compare them automatically.
                    </p>

                    {/* Drop Zone */}
                    <div
                        className={`drop-zone ${bidDragging ? 'active' : ''}`}
                        onClick={() => bidInputRef.current?.click()}
                        onDragEnter={(e) => { e.preventDefault(); setBidDragging(true); }}
                        onDragOver={(e) => e.preventDefault()}
                        onDragLeave={() => setBidDragging(false)}
                        onDrop={handleBidsDrop}
                    >
                        <div className="drop-icon">
                            {bidFiles?.length ? <Archive size={48} /> : <FolderUp size={48} />}
                        </div>
                        {bidFiles?.length ? (
                            <>
                                <div className="drop-label" style={{ color: '#c084fc' }}>
                                    {bidFiles.length} file{bidFiles.length > 1 ? 's' : ''} selected
                                </div>
                                <div className="drop-hint">
                                    {Array.from(bidFiles).map(f => f.name).join(', ')}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="drop-label">Drop bid PDFs or a CSV here</div>
                                <div className="drop-hint">Multiple PDFs supported, or one CSV — click to browse</div>
                            </>
                        )}
                        <input
                            ref={bidInputRef}
                            type="file"
                            accept=".pdf,.csv,.xlsx"
                            multiple
                            style={{ display: 'none' }}
                            onChange={(e) => setBidFiles(Array.from(e.target.files))}
                        />
                    </div>

                    {/* Progress */}
                    {bidsUploading && (
                        <div className="progress-bar-track">
                            <div className="progress-bar-fill" style={{ width: `${bidsProgress}%` }} />
                        </div>
                    )}

                    <button
                        className="btn-primary"
                        onClick={handleBidsUpload}
                        disabled={bidsUploading || !bidFiles?.length}
                        style={{ width: '100%', marginTop: '1rem', justifyContent: 'center', background: 'linear-gradient(135deg, #7c3aed, #c084fc)' }}
                    >
                        {bidsUploading ? <><ScanSearch size={18} style={{ marginRight: '6px' }} /> Extracting Data...</> : <><BrainCircuit size={18} style={{ marginRight: '6px' }} /> Upload & Extract</>}
                    </button>

                    {/* Batch ID Result Card */}
                    {bidsResult && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem', color: 'var(--success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle2 size={20} /> {bidsResult.count} Bid(s) Processed
                            </div>

                            <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Your Batch ID:
                            </div>
                            <div className="batch-id-card">
                                <span className="batch-id-value">{bidsResult.batch_id}</span>
                                <button
                                    className="btn-secondary"
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', flexShrink: 0 }}
                                    onClick={() => copyToClipboard(bidsResult.batch_id)}
                                >
                                    <Copy size={16} /> Copy
                                </button>
                            </div>

                            <button
                                className="btn-primary"
                                style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
                                onClick={() => navigate('/dashboard')}
                            >
                                <LayoutDashboard size={18} style={{ marginRight: '6px' }} /> Go to Dashboard → Compare Bids
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
