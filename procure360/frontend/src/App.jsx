import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Dashboard from './components/DashBoard';
import FileUpload from './components/FileUpload';
import AuditTrail from './components/AuditTrail';
import './index.css';

function App() {
  return (
    <div className="app-container">

      {/* 🚀 Navigation Bar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        background: 'var(--glass-bg)',
        borderRadius: '12px',
        marginBottom: '3rem',
        border: '1px solid var(--glass-border)'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Procure360
        </div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <Link to="/" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500' }}>Home</Link>
          <Link to="/upload" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500' }}>Uploads</Link>
          <Link to="/dashboard" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500' }}>Dashboard</Link>
          <Link to="/audit" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500' }}>Audit Trail</Link>
        </div>
      </nav>

      {/* 🛣️ Routing Setup */}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<FileUpload />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/audit" element={<AuditTrail />} />
        </Routes>
      </main>

    </div>
  );
}

// 🏠 Premium Home Page Component
function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>

      {/* Hero Section */}
      <h1 style={{ fontSize: '4rem', fontWeight: '700', marginBottom: '1rem', background: 'linear-gradient(135deg, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Smarter Procurement. <br /> Faster Decisions.
      </h1>

      <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 3rem auto', lineHeight: '1.6' }}>
        Procure360 uses AI to automatically scan your contracts for risks and ranks vendor bids so you can choose the best partner with confidence.
      </p>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '5rem' }}>
        <button
          className="btn-primary"
          style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
          onClick={() => navigate('/upload')}
        >
          🚀 Start Uploading
        </button>
        <button
          className="btn-primary"
          style={{ padding: '1rem 2rem', fontSize: '1.1rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--glass-border)' }}
          onClick={() => navigate('/dashboard')}
        >
          📊 View Dashboard
        </button>
      </div>

      {/* Feature Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', textAlign: 'left' }}>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ color: '#60a5fa', marginBottom: '1rem', fontSize: '1.5rem' }}>📜 AI Contract Scanner</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Instantly identify hidden risks like "unlimited liability" or bad payment terms in your master contracts.</p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ color: '#c084fc', marginBottom: '1rem', fontSize: '1.5rem' }}>🤝 Smart Bid Ranking</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Upload multiple vendor bids and let our algorithm rank them based on Price, Lead Time, and Terms.</p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ color: '#10b981', marginBottom: '1rem', fontSize: '1.5rem' }}>🧠 Explainable AI</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Don't just get a score. Get a human-readable explanation of exactly why a vendor was ranked #1.</p>
        </div>

      </div>
    </div>
  );
}

export default App;
