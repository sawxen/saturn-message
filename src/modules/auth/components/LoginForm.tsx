import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/api';
import type {AuthResponse, ApiError} from '../api/types';

const LoginForm: React.FC = () => {
    const [email, setEmail] = React.useState<string>('');
    const [password, setPassword] = React.useState<string>('');
    const [error, setError] = React.useState<string>('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        try {
            const response: AuthResponse = await login({ email, password });
            console.log('Успешная авторизация:', response);
            localStorage.setItem('token', response.token);
            setError('');
            navigate('/home');
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#0e1621] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#17212b] rounded-lg shadow-lg overflow-hidden">
                <div className="bg-[#2b5278] p-6">
                    <h1 className="text-white text-2xl font-bold text-center">Saturn</h1>
                    <p className="text-[#8f9aa7] text-center mt-2">Вход</p>
                </div>
                <div className="space-y-4 p-6">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[#8f9aa7]">
                            Почта
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 w-full px-4 py-3 bg-[#242f3d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5682a3] border border-[#2b5278] placeholder-[#5d6b7b]"
                            placeholder="example@domain.com"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-[#8f9aa7]">
                            Пароль
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 w-full px-4 py-3 bg-[#242f3d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5682a3] border border-[#2b5278] placeholder-[#5d6b7b]"
                            placeholder="********"
                            required
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full bg-[#5288c1] text-white py-3 px-4 rounded-lg hover:bg-[#4674a9] focus:outline-none focus:ring-2 focus:ring-[#5682a3] transition-colors"
                    >
                        Войти
                    </button>
                </div>
                <div className="p-6 text-center text-[#8f9aa7] text-sm">
                    <p>Нет аккаунта? <a onClick={() => navigate('/register')} className="text-[#5288c1] hover:underline cursor-pointer">Зарегистрироваться</a></p>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;