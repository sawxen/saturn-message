import * as React from 'react';
import Sidebar from './sidebar/Sidebar';
import ChatArea from './chatarea/ChatArea';
import axiosInstance from './api/axiosInstance';

const Home: React.FC = () => {
    const [selectedChatId, setSelectedChatId] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState<string>('');
    const [chatName, setChatName] = React.useState<string>('Chat');
    const [currentUser, setCurrentUser] = React.useState<any>(null);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            setError(null);
            try {
                console.log('Fetching user from:', axiosInstance.defaults.baseURL + '/users/me');
                const response = await axiosInstance.get('/users/me');
                console.log('User response:', response.data);
                setCurrentUser({
                    id: response.data._id,
                    name: response.data.public.displayName, // Извлекаем из public
                    username: response.data.public.username, // Извлекаем из public
                    avatar: response.data.public.avatar, // Извлекаем из public
                    status: response.data.public.status, // Извлекаем из public
                });
            } catch (error: any) {
                console.error('Failed to fetch current user:', error.response?.status, error.response?.data || error.message);
                setError(`Не удалось загрузить данные пользователя: ${error.response?.statusText || error.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    if (loading) return <div className="flex items-center justify-center h-screen text-white">Загрузка...</div>;
    if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-[#0e1621] flex">
            <Sidebar
                onSelectChat={setSelectedChatId}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onChatNameChange={setChatName}
                currentUser={currentUser}
            />
            <div className="flex-1">
                <ChatArea selectedChatId={selectedChatId} chatName={chatName} />
            </div>
        </div>
    );
};

export default Home;