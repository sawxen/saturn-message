import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: '/api', // Обновленный базовый URL
    headers: {
        'Content-Type': 'application/json',
    },
    transformRequest: [
        (data, headers) => {
            if (data instanceof FormData) {
                delete headers['Content-Type'];
                return data;
            }
            return JSON.stringify(data);
        }
    ]
});

// Интерсептор для добавления токена
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    console.log('Token used:', token); // Отладочный лог
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Интерсептор для обработки ошибок
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;