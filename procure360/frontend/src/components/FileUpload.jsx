import React, { useState } from 'react';
import { uploadcontract, uploadBids } from '../api';

export default function FileUpload() {
    // Contract State
    const [contractFile, setContractFile] = useState(null);
    const [isContractUploading, setIsContractUploading] = useState(false);
    const [contractResult, setContractResult] = useState(null);

    // Bids State
    const [bidFiles, setBidFiles] = useState(null);
    const [isBidsUploading, setIsBidsUploading] = useState(false);
    const [bidsResult, setBidsResult] = useState(null);

    // --- Contract Upload Logic ---
    const handleContractUpload = async () => {
        if (!contractFile) return;
        setIsContractUploading(true);
        try {
            const result = await uploadcontract(contractFile);
            setContractResult(result);
            setContractFile(null);
            alert("Contract Uploaded Successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to upload contract.");
        } finally {
            setIsContractUploading(false);
        }
    };

    // --- Bids Upload Logic ---
    const handleBidsUpload = async () => {
        if (!bidFiles || bidFiles.length === 0) return;
        setIsBidsUploading(true);
        try {
            const result = await uploadBids(bidFiles);
            setBidsResult(result);
            setBidFiles(null);
            alert("Bids Uploaded Successfully! Copy the Batch ID to compare.");
        } catch (error) {
            console.error(error);
            alert("Failed to upload bids.");
        } finally {
            setIsBidsUploading(false);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '2rem', margin: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>

            {/* 📜 SECTION 1: Upload Contract */}
            <div className='glass-panel' style={{ padding: '2rem', flex: '1', minWidth: '350px' }}>
                <h2>📜 Upload Master Contract</h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>Scan contract for risky clauses.</p>
                <input
                    type="file"
                    onChange={(e) => setContractFile(e.target.files[0])}
                    accept=".pdf"
                    style={{ marginBottom: '1rem', width: '100%' }}
                />
                <button
                    onClick={handleContractUpload}
                    disabled={isContractUploading || !contractFile}
                    style={{ background: '#007BFF', color: 'white', padding: '0.8rem 1.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}
                >
                    {isContractUploading ? 'Scanning Contract...' : 'Upload & Scan Contract'}
                </button>

                {/* Contract Scan Results */}
                {contractResult && (
                    <div style={{ marginTop: '2rem', background: '#fff', padding: '1rem', borderRadius: '8px', color: 'black' }}>
                        <h3 style={{ color: '#d9534f' }}>Risks Found: {contractResult.flags_found}</h3>
                        <ul style={{ paddingLeft: '20px', marginTop: '1rem' }}>
                            {contractResult.flags.map((f, i) => (
                                <li key={i} style={{ marginBottom: '10px' }}>
                                    <strong>{f.severity} ({f.flag_type}):</strong> {f.clause_text}
                                    <p style={{ fontSize: '0.85rem', color: '#555', margin: 0 }}>{f.reason}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* 🤝 SECTION 2: Upload Bids */}
            <div className='glass-panel' style={{ padding: '2rem', flex: '1', minWidth: '350px' }}>
                <h2>🤝 Upload Vendor Bids</h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>Upload multiple PDFs to rank them.</p>
                <input
                    type="file"
                    multiple // 👈 Allow multiple files
                    onChange={(e) => setBidFiles(e.target.files)}
                    accept=".pdf"
                    style={{ marginBottom: '1rem', width: '100%' }}
                />
                <button
                    onClick={handleBidsUpload}
                    disabled={isBidsUploading || !bidFiles}
                    style={{ background: '#28a745', color: 'white', padding: '0.8rem 1.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}
                >
                    {isBidsUploading ? 'Extracting Data...' : 'Upload Bids'}
                </button>

                {/* Bids Upload Results */}
                {bidsResult && (
                    <div style={{ marginTop: '2rem', background: '#e9ecef', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', color: 'black' }}>
                        <h3 style={{ color: '#28a745' }}>Bids Processed! ✅</h3>
                        <p style={{ margin: '1rem 0' }}>Your Batch ID is:</p>
                        <code style={{ background: '#333', color: '#fff', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '1.2rem', userSelect: 'all' }}>
                            {bidsResult.batch_id}
                        </code>
                        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                            Copy this Batch ID and go to the <b>Dashboard</b> to compare them!
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
}
