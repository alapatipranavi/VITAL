import axios from 'axios';

const API_URL = '/api';

export const apiService = {
  // Reports
  uploadReport: async (file) => {
    const formData = new FormData();
    formData.append('report', file);
    const response = await axios.post(`${API_URL}/reports/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getReports: async () => {
    const response = await axios.get(`${API_URL}/reports`);
    return response.data.reports;
  },

  getReportById: async (id) => {
    const response = await axios.get(`${API_URL}/reports/${id}`);
    return response.data.report;
  },

  deleteReport: async (id) => {
    const response = await axios.delete(`${API_URL}/reports/${id}`);
    return response.data;
  },

  // Biomarkers
  getBiomarkerDetails: async (testName, reportId) => {
    const response = await axios.get(`${API_URL}/biomarkers/details`, {
      params: { testName, reportId }
    });
    return response.data;
  },

  getAbnormalBiomarkers: async () => {
    const response = await axios.get(`${API_URL}/biomarkers/abnormal`);
    return response.data.abnormalBiomarkers;
  },

  // Trends
  getTrends: async (testName) => {
    const response = await axios.get(`${API_URL}/trends/${testName}`);
    return response.data;
  },

  getAllTrends: async () => {
    const response = await axios.get(`${API_URL}/trends`);
    return response.data.trends;
  },

  getDoctorSummary: async () => {
    const response = await axios.get(`${API_URL}/trends/summary/doctor`);
    return response.data;
  }
};

