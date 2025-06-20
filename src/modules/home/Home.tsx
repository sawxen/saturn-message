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
                const response = await axiosInstance.get('/users/me');
                setCurrentUser({
                    id: response.data._id,
                    name: response.data.public.displayName,
                    username: response.data.public.username,
                    avatar: response.data.public.avatar,
                    status: response.data.public.status,
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

    // Handle chat selection
    const handleSelectChat = (chatId: string) => {
        setSelectedChatId(chatId);
        // Optionally fetch chat details to update chatName
        // Example: Assume you have a getChatName API or chat list
        // const chat = await getChat(chatId); // Replace with actual API call
        // setChatName(chat.name || 'Chat');
    };

    if (loading) return <div className="flex items-center justify-center h-screen text-white">Загрузка...</div>;
    if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-[#0e1621] flex">
            <Sidebar
                onSelectChat={handleSelectChat} // Pass the handler function
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onChatNameChange={setChatName} // This prop seems intended to update chatName
                currentUser={currentUser}
            />
            <div className="flex-1">
                <ChatArea selectedChatId={selectedChatId} chatName={chatName} />
            </div>
        </div>
    );
};

export default Home;