import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'https://chatifyzone07.onrender.com/api',
    withCredentials: true, // Sabhi requests ke sath cookies jayengi
});

export default axiosInstance;
