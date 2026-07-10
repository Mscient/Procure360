import axios from 'axios'

export const api = axios.create({
    baseURL: 'http://127.0.0.1:8000'
})

export const uploadcontract = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/contracts/upload', formData);
    return response.data;

};

export const uploadBids = async (files) => {
    const formData = new FormData();
    // multiple files असल्यामुळे loop लावून append करावं लागतं
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    const response = await api.post('/bids/upload/', formData);
    return response.data;
};


export const chatWithContract = async (contractId, question) => {
    const response = await api.post('/chat/', {
        contract_id: contractId,
        question: question
    });
    return response.data;
};

export const getContractFlags = async (contractId) => {
    const response = await api.get(`/contracts/${contractId}/flags`);
    return response.data;
};

export const getRiskAnalytics = async () => {
    const response = await api.get('/contracts/analytics/risks');
    return response.data;
};

export const getAuditLogs = async () => {
    const response = await api.get('/audit/');
    return response.data;
};

export const getAuditExportUrl = () => {
    return `${api.defaults.baseURL}/audit/export`;
};
