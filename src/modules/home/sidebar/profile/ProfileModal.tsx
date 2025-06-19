import * as React from 'react';
import { getProfile, updateProfile } from './api/api.ts';
import type { UserProfile, EditUserDto } from './api/types.ts';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';

// Функция для проверки валидности URL
const isValidUrl = (url: string): boolean => {
    if (!url) return true; // Пустое значение допустимо
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile | null;
    setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, profile, setProfile }) => {
    const navigate = useNavigate();
    const [editMode, setEditMode] = React.useState(false);
    const [formData, setFormData] = React.useState<EditUserDto>({
        displayName: profile?.name || '',
        username: profile?.username || '',
        bio: profile?.bio || '',
        avatar: profile?.avatar || '',
        birthDate: profile?.birthDate || ''
    });
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        if (profile) {
            setFormData({
                displayName: profile.name,
                username: profile.username,
                bio: profile.bio || '',
                avatar: profile.avatar || '',
                birthDate: profile.birthDate || ''
            });
        }
    }, [profile]);

    const fetchProfile = React.useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await getProfile();
            setProfile(data);
        } catch (error: unknown) {
            console.error('Ошибка загрузки профиля:', error);
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                // @ts-ignore
                setError(axiosError.response?.data?.message || 'Не удалось загрузить профиль');
                if (axiosError.response?.status === 401) {
                    handleLogout();
                }
            } else {
                setError((error as Error).message || 'Не удалось загрузить профиль');
            }
        } finally {
            setIsLoading(false);
        }
    }, [setProfile]);

    React.useEffect(() => {
        if (isOpen && !profile) {
            fetchProfile().catch(console.error);
        }
    }, [isOpen, profile, fetchProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (formData.displayName.length < 3 || formData.username.length < 3) {
            setError('Имя и имя пользователя должны содержать минимум 3 символа');
            return;
        }
        if (formData.avatar && !isValidUrl(formData.avatar)) {
            setError('URL аватара должен быть действительным адресом');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const updatedProfile = await updateProfile(formData);
            setProfile(updatedProfile);
            setEditMode(false);
        } catch (error: unknown) {
            console.error('Ошибка обновления профиля:', error);
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                // @ts-ignore
                setError(axiosError.response?.data?.message || 'Не удалось обновить профиль');
            } else {
                setError((error as Error).message || 'Не удалось обновить профиль');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}> {/* Добавлен inline-стиль для отладки */}
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-700/50 transform transition-all duration-300 hover:shadow-2xl">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-semibold text-white tracking-wide">
                            {editMode ? 'Информация' : 'Мой профиль'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-600/20 text-red-200 rounded-lg text-sm border border-red-700/50 animate-pulse-once">
                            {error}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mb-4"></div>
                            <p className="text-gray-300">
                                {editMode ? 'Сохранение изменений...' : 'Загрузка профиля...'}
                            </p>
                        </div>
                    ) : editMode ? (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Имя <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 transition-all duration-200 placeholder-gray-500"
                                    placeholder="Введите имя"
                                    minLength={3}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Имя пользователя <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 transition-all duration-200 placeholder-gray-500"
                                    placeholder="Введите имя пользователя"
                                    minLength={3}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">О себе</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 transition-all duration-200 min-h-[120px] placeholder-gray-500"
                                    placeholder="Расскажите о себе"
                                    rows={4}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">URL аватара</label>
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="text"
                                        name="avatar"
                                        value={formData.avatar}
                                        onChange={handleChange}
                                        className="flex-1 px-4 py-2.5 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 transition-all duration-200 placeholder-gray-500"
                                        placeholder="Вставьте URL изображения"
                                    />
                                    {formData.avatar && (
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-600">
                                            <img
                                                src={formData.avatar}
                                                alt="Предпросмотр"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">Дата рождения</label>
                                <input
                                    type="date"
                                    name="birthDate"
                                    value={formData.birthDate}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 transition-all duration-200"
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={() => setEditMode(false)}
                                    disabled={isLoading}
                                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Сохранение...
                                        </>
                                    ) : 'Сохранить'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-col">
                                <div className={`flex items-center gap-5`}>
                                    <div className="relative group">
                                        {profile?.avatar ? (
                                            <img
                                                src={profile.avatar}
                                                alt="Профиль"
                                                className="w-20 h-20 rounded-full object-cover shadow-md transition-all duration-300"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-28 h-28 rounded-full bg-gray-700 flex items-center justify-center border-4 border-gray-700 group-hover:border-blue-500 transition-all duration-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                        <div className={`flex flex-col gap-1`}>
                                            <h3 className="text-lg font-bold text-white">{profile?.name || 'Нет имени'}</h3>
                                                <div className="flex items-center text-sm text-blue-400">
                                                    В сети
                                                </div>
                                        </div>
                                    </div>
                                </div>
                            <div className="space-y-4">
                                {/* О себе */}
                                <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
                                    <h4 className="text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wide">О себе</h4>
                                    <p className="text-gray-100">
                                        {profile?.bio ? (
                                            profile.bio
                                        ) : (
                                            <span className="text-gray-500 italic">Не указано</span>
                                        )}
                                    </p>
                                </div>

                                {/* Логин */}
                                <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
                                    <h4 className="text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wide">Логин</h4>
                                    <p className="text-blue-400 font-medium">
                                        @{profile?.name || 'неизвестно'}
                                    </p>
                                </div>

                                    <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
                                        <h4 className="text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wide">Дата рождения</h4>
                                        <p className="text-gray-100">
                                            {profile?.birthDate || 'Неизвестно'}
                                        </p>
                                    </div>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Изменить
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Выход
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;