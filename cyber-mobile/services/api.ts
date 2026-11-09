import axios from 'axios';

const api = axios.create({
  baseURL: 'https://cyber-athletic-api.onrender.com', 
});

export default api;