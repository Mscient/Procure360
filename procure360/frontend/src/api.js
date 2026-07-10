import axios from 'axios';

export const api = axios.create({
    // If running in Docker (served by Nginx), use /api.
    // If running via 'npm run dev', use localhost:8000.
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
});

// ── Contracts ─────────────────────────────────────────────────────────

export const uploadContract = async (file, expiresAt = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (expiresAt) formData.append('expires_at', expiresAt);
    const response = await api.post('/contracts/upload', formData);
    return response.data;
};

// Keep old name as alias so nothing else breaks
export const uploadcontract = uploadContract;

export const getContractFlags = async (contractId) => {
    const response = await api.get(`/contracts/${contractId}/flags`);
    return response.data;
};

export const updateContractStatus = async (contractId, status) => {
    const response = await api.patch(`/contracts/${contractId}/status`, { status });
    return response.data;
};

// ── Bids ──────────────────────────────────────────────────────────────

export const uploadBids = async (files) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
    }
    const response = await api.post("/bids/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export const uploadBidsCsv = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/bids/upload-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export const compareBids = async (batchId) => {
    const response = await api.get(`/bids/compare/${batchId}`);
    return response.data;
};

// ── Chat ──────────────────────────────────────────────────────────────

export const chatWithContract = async (contractId, question) => {
    const response = await api.post('/chat/', { contract_id: contractId, question });
    return response.data;
};

// ── Analytics ─────────────────────────────────────────────────────────

export const getRiskAnalytics = async () => {
    const response = await api.get('/contracts/analytics/risks');
    return response.data;
};

// ── Stats ─────────────────────────────────────────────────────────────

export const getStatsSummary = async () => {
    const response = await api.get('/stats/summary');
    return response.data;
};

// ── Vendors ───────────────────────────────────────────────────────────

export const getVendors = async () => {
    const response = await api.get('/vendors/');
    return response.data;
};

export const getVendorHistory = async (vendorName) => {
    const response = await api.get(`/vendors/${encodeURIComponent(vendorName)}/history`);
    return response.data;
};

// ── Audit ─────────────────────────────────────────────────────────────

export const getAuditLogs = async () => {
    const response = await api.get('/audit/');
    return response.data;
};

export const getAuditExportUrl = () => `${api.defaults.baseURL}/audit/export`;
