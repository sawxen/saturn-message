import * as React from 'react';
import { getProfile, updateProfile } from '../api/api';
import type { UserProfile, EditUserDto } from '../api/types';
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
            console.error('Profile load error:', error);
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                setError(axiosError.response?.data?.message || 'Failed to load profile');
                if (axiosError.response?.status === 401) {
                    handleLogout();
                }
            } else {
                setError((error as Error).message || 'Failed to load profile');
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
            setError('Display Name and Username must be at least 3 characters');
            return;
        }
        if (formData.avatar && !isValidUrl(formData.avatar)) {
            setError('Avatar must be a valid URL address');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const updatedProfile = await updateProfile(formData);
            setProfile(updatedProfile);
            setEditMode(false);
        } catch (error: unknown) {
            console.error('Profile update failed:', error);
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                setError(axiosError.response?.data?.message || 'Failed to update profile');
            } else {
                setError((error as Error).message || 'Failed to update profile');
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-700/50">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-2xl font-bold text-white">
                            {editMode ? 'Edit Profile' : 'User Profile'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                            disabled={isLoading}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 text-red-300 rounded-lg text-sm border border-red-500/30">
                            {error}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                            <p className="text-gray-400">
                                {editMode ? 'Saving changes...' : 'Loading profile...'}
                            </p>
                        </div>
                    ) : editMode ? (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Display Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 transition-all"
                                    placeholder="Enter your name"
                                    minLength={3}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 transition-all"
                                    placeholder="Enter username"
                                    minLength={3}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 transition-all min-h-[100px]"
                                    placeholder="Tell something about yourself"
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 mb-1">Avatar URL</label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="text"
                                        name="avatar"
                                        value={formData.avatar}
                                        onChange={handleChange}
                                        className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 transition-all"
                                        placeholder="Paste image URL"
                                    />
                                    {formData.avatar && (
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-700">
                                            <img
                                                src={formData.avatar}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-400 mb-1">Birth Date</label>
                                <input
                                    type="date"
                                    name="birthDate"
                                    value={formData.birthDate}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 transition-all"
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={() => setEditMode(false)}
                                    disabled={isLoading}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center">
                                <div className="relative mb-4 group">
                                    {profile?.avatar ? (
                                        <img
                                            src={profile.avatar}
                                            alt="Profile"
                                            className="w-24 h-24 rounded-full object-cover border-4 border-gray-700 shadow-lg group-hover:border-blue-500 transition-colors"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center border-4 border-gray-700 group-hover:border-blue-500 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 shadow-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white">{profile?.name || 'No name'}</h3>
                                <p className="text-blue-400">@{profile?.username || 'username'}</p>
                                {profile?.status === 'online' && (
                                    <div className="mt-1 flex items-center text-sm text-green-400">
                                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                                        Online
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                                    <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">About</h4>
                                    <p className="text-white">
                                        {profile?.bio ? (
                                            profile.bio
                                        ) : (
                                            <span className="text-gray-500 italic">No bio yet</span>
                                        )}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                                        <h4 className="text-sm font-semibold text-gray-400 mb-1 uppercase tracking-wider">Status</h4>
                                        <p className="text-green-400 font-medium capitalize">
                                            {profile?.status || 'offline'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                                        <h4 className="text-sm font-semibold text-gray-400 mb-1 uppercase tracking-wider">Joined</h4>
                                        <p className="text-white">
                                            {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all flex items-center justify-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit Profile
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all flex items-center justify-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Logout
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