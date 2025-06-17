import axios from 'axios';

const API_BASE_URL = 'https://chatapi-production-31cb.up.railway.app/auth';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const message: string = error.response?.data?.message || 'Произошла ошибка';
        return Promise.reject({ message });
    }
);

export default axiosInstance;