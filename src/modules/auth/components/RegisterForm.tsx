import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/api.ts';
import type {AuthResponse, ApiError} from '../api/types';

const RegisterForm: React.FC = () => {
    const [email, setEmail] = React.useState<string>('');
    const [username, setUsername] = React.useState<string>('');
    const [displayName, setDisplayName] = React.useState<string>('');
    const [password, setPassword] = React.useState<string>('');
    const [error, setError] = React.useState<string>('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        try {
            const response: AuthResponse = await register({
                email,
                username,
                displayName,
                password,
                publicKey: '123' // Hardcoded publicKey as a temporary workaround
            });
            console.log('Successful registration:', response);
            setError('');
            navigate('/login');
        } catch (err) {
            const apiError = err as ApiError;
            console.error('Registration error:', apiError.message);
            setError(apiError.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#0e1621] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#17212b] rounded-lg shadow-lg overflow-hidden">
                <div className="bg-[#2b5278] p-6">
                    <h1 className="text-white text-2xl font-bold text-center">Saturn</h1>
                    <p className="text-[#8f9aa7] text-center mt-2">Регистрация</p>
                </div>
                <div className="p-6 space-y-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-[#242f3d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5682a3] border border-[#2b5278] placeholder-[#5d6b7b]"
                            placeholder="Почта"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-[#242f3d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5682a3] border border-[#2b5278] placeholder-[#5d6b7b]"
                            placeholder="Логин"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-4 py-3 bg-[#242f3d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5682a3] border border-[#2b5278] placeholder-[#5d6b7b]"
                            placeholder="Никнейм"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-[#242f3d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5682a3] border border-[#2b5278] placeholder-[#5d6b7b]"
                            placeholder="Пароль"
                            required
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full bg-[#5288c1] text-white py-3 px-4 rounded-lg hover:bg-[#4674a9] focus:outline-none focus:ring-2 focus:ring-[#5682a3] transition-colors"
                    >
                        Зарегистрироваться
                    </button>
                </div>
                <div className="p-6 text-center text-[#8f9aa7] text-sm">
                    <p>Уже есть аккаунт? <a onClick={() => navigate('/login')} className="text-[#5288c1] hover:underline cursor-pointer">Войти</a></p>
                </div>
            </div>
        </div>
    );
};

export default RegisterForm;