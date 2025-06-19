import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/api';
import type { AuthResponse, ApiError } from '../api/types';
import { FiLogIn, FiMail, FiLock, FiUserPlus } from 'react-icons/fi';

const LoginForm: React.FC = () => {
    const [email, setEmail] = React.useState<string>('');
    const [password, setPassword] = React.useState<string>('');
    const [error, setError] = React.useState<string>('');
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response: AuthResponse = await login({ email, password });
            localStorage.setItem('token', response.token);
            setError('');
            navigate('/home');
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка авторизации');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0e1621] to-[#1a2639] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#17212b] rounded-xl shadow-2xl overflow-hidden border border-[#2b5278]/50">
                {/* Заголовок с градиентом */}
                <div className="bg-gradient-to-r from-[#2b5278] to-[#3a6ea5] p-6">
                    <div className="flex items-center justify-center space-x-3">
                        <h1 className="text-white text-2xl font-bold">Saturn Messenger</h1>
                    </div>
                    <p className="text-white/80 text-center mt-2 text-sm">Войдите в свой аккаунт</p>
                </div>

                {/* Форма */}
                <form onSubmit={handleSubmit} className="space-y-5 p-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label htmlFor="email" className="block text-sm font-medium text-[#8f9aa7]">
                            Электронная почта
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiMail className="text-[#5d6b7b]" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 mt-1 w-full px-4 py-3 bg-[#242f3d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5682a3] border border-[#2b5278]/50 placeholder-[#5d6b7b]"
                                placeholder="example@domain.com"
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="password" className="block text-sm font-medium text-[#8f9aa7]">
                            Пароль
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiLock className="text-[#5d6b7b]" />
                            </div>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 mt-1 w-full px-4 py-3 bg-[#242f3d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5682a3] border border-[#2b5278]/50 placeholder-[#5d6b7b]"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-[#5288c1] to-[#3a6ea5] text-white py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#5682a3] transition-all duration-200 disabled:opacity-70"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Вход...</span>
                            </>
                        ) : (
                            <>
                                <FiLogIn />
                                <span>Войти</span>
                            </>
                        )}
                    </button>

                    <div className="flex items-center justify-between pt-2">
                        <a href="#" className="text-sm text-[#5288c1] hover:underline">Забыли пароль?</a>
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="flex items-center text-sm text-[#8f9aa7] hover:text-[#5288c1] transition-colors"
                        >
                            <FiUserPlus className="mr-1" />
                            Создать аккаунт
                        </button>
                    </div>
                </form>

                {/* Футер */}
                <div className="px-6 py-4 bg-[#1e2a38] text-center text-[#5d6b7b] text-xs">
                    © {new Date().getFullYear()} Saturn Messenger. Все права защищены.
                </div>
            </div>
        </div>
    );
};

export default LoginForm;