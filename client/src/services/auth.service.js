import axios from 'axios';

const API_URL = '/api/auth';

let token = null;

export const authService = {
  setToken: (newToken) => {
    token = newToken;
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  },

  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    authService.setToken(response.data.token);
    return response.data;
  },

  register: async (email, password, profile) => {
    const response = await axios.post(`${API_URL}/register`, {
      email,
      password,
      profile
    });
    authService.setToken(response.data.token);
    return response.data;
  },

  getProfile: async () => {
    const response = await axios.get(`${API_URL}/profile`);
    return response.data.user;
  },

  updateProfile: async (profileData) => {
    const response = await axios.put(`${API_URL}/profile`, profileData);
    return response.data.user;
  }
};

// Initialize token from localStorage
if (typeof window !== 'undefined') {
  const storedToken = localStorage.getItem('token');
  if (storedToken) {
    authService.setToken(storedToken);
  }
}

