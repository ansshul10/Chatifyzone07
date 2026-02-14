import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true, // Sabhi requests ke sath cookies jayengi
});

export default axiosInstance;