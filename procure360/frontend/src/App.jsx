import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Zap, FileSignature, Handshake, BrainCircuit, Building2, FileSearch, Rocket, Upload, LayoutDashboard } from 'lucide-react';
import Dashboard from './components/DashBoard';
import FileUpload from './components/FileUpload';
import AuditTrail from './components/AuditTrail';
import Vendors from './components/Vendors';
import { ToastProvider } from './components/ToastContext';
import './index.css';

function App() {
  return (
    <ToastProvider>
      <div className="app-container">

        {/* ── Navigation Bar ── */}
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1.5rem',
          background: 'var(--glass-bg)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2.5rem',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: '1rem',
          zIndex: 100,
        }}>
          {/* Logo */}
          <div style={{
            fontSize: '1.4rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #60a5fa, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}>
            <Zap size={24} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px', color: '#2563eb' }} /> Procure360
          </div>

          {/* Nav Links — NavLink auto-applies "active" class */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <NavLink to="/"        className="nav-link" end>Home</NavLink>
            <NavLink to="/upload"  className="nav-link">Uploads</NavLink>
            <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
            <NavLink to="/vendors" className="nav-link">Vendors</NavLink>
            <NavLink to="/audit"   className="nav-link">Audit Trail</NavLink>
          </div>
        </nav>

        {/* ── Routes ── */}
        <main>
          <Routes>
            <Route path="/"          element={<Home />} />
            <Route path="/upload"    element={<FileUpload />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vendors"   element={<Vendors />} />
            <Route path="/audit"     element={<AuditTrail />} />
          </Routes>
        </main>

      </div>
    </ToastProvider>
  );
}

/* ── Home / Landing Page ─────────────────────────────────────────────── */
function Home() {
  const navigate = useNavigate();

  const FEATURES = [
    {
      icon: <FileSignature size={32} />,
      title: 'AI Contract Scanner',
      desc: 'Instantly identify hidden risks like "unlimited liability" or bad payment terms in your master contracts.',
      color: '#2563eb',
    },
    {
      icon: <Handshake size={32} />,
      title: 'Smart Bid Ranking',
      desc: 'Upload multiple vendor bids and let our 5-factor AI algorithm rank them on Price, Lead Time, Terms, Warranty, and Price Hold.',
      color: '#4f46e5',
    },
    {
      icon: <BrainCircuit size={32} />,
      title: 'Explainable AI',
      desc: "Don't just get a score. Get a human-readable breakdown of exactly why a vendor was ranked #1.",
      color: '#059669',
    },
    {
      icon: <Building2 size={32} />,
      title: 'Vendor Profiles',
      desc: 'Track every vendor across bids — see win rates, average scores, and full deal history in one place.',
      color: '#d97706',
    },
    {
      icon: <FileSearch size={32} />,
      title: 'Enterprise Audit Trail',
      desc: 'Immutable, exportable log of every action: uploads, disputes, and AI decisions — for full compliance.',
      color: '#0284c7',
    },
    {
      icon: <Zap size={32} />,
      title: 'Contract Lifecycle',
      desc: 'Track contract status from Draft → Active → Expired, with smart alerts for contracts expiring soon.',
      color: '#dc2626',
    },
  ];

  return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>

      {/* Hero */}
      <div style={{ marginBottom: '4rem' }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '99px',
          padding: '0.35rem 1rem',
          fontSize: '0.85rem',
          color: 'var(--accent-color)',
          marginBottom: '1.5rem',
          fontWeight: 500,
        }}>
          <Rocket size={16} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '6px' }} /> AI-Powered Procurement Intelligence
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: '800',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, var(--text-primary) 30%, #475569)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
        }}>
          Smarter Procurement.<br />Faster Decisions.
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-secondary)',
          maxWidth: '600px',
          margin: '0 auto 2.5rem auto',
          lineHeight: '1.7',
        }}>
          Procure360 uses Gemini AI to scan contracts for hidden risks and rank
          vendor bids so you choose the best partner with full confidence.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }} onClick={() => navigate('/upload')}>
            <Upload size={18} /> Start Uploading
          </button>
          <button className="btn-secondary" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }} onClick={() => navigate('/dashboard')}>
            <LayoutDashboard size={18} /> View Dashboard
          </button>
        </div>
      </div>

      {/* Feature Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        textAlign: 'left',
      }}>
        {FEATURES.map((f, i) => (
          <div key={i} className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
            <h3 style={{ color: f.color, marginBottom: '0.75rem', fontSize: '1.15rem', fontWeight: '600' }}>
              {f.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
