import * as React from 'react';
import UserSearch from './usersearch/UserSearch';
import ChatList from './chatlist/ChatList';
import Profile from './profile/Profile';
import { getChats, searchUsers, createChat } from './usersearch/api/api';
import { useDebounce } from 'use-debounce';
import { useNotifications } from './notifications/notifyhook';
import NotificationList from './notifications/NotificationsList.tsx';
import { joinGroup } from './notifications/api'; // Исправленный путь

export interface Chat {
    id: string;
    name: string;
    lastMessage: string;
}

export interface User {
    id: string;
    name: string;
}

const Sidebar: React.FC<{
    onSelectChat: (id: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}> = ({ onSelectChat, searchQuery, setSearchQuery }) => {
    const [chats, setChats] = React.useState<Chat[]>([]);
    const [allUsers, setAllUsers] = React.useState<User[]>([]);
    const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
    const { notifications, unreadCount, markAllAsRead, fetchNotifications } = useNotifications();
    const [isNotificationVisible, setIsNotificationVisible] = React.useState(false);

    React.useEffect(() => {
        (async () => {
            try {
                const fetchedChats = await getChats();
                setChats(fetchedChats);
            } catch (error) {
                console.error('Failed to fetch chats:', error);
            }
        })();
    }, []);

    React.useEffect(() => {
        (async () => {
            if (debouncedSearchQuery && debouncedSearchQuery.length >= 3) {
                try {
                    const fetchedUsers = await searchUsers(debouncedSearchQuery);
                    setAllUsers(fetchedUsers);
                } catch (error) {
                    console.error('Failed to fetch users:', error);
                }
            } else {
                setAllUsers([]);
            }
        })();
    }, [debouncedSearchQuery]);

    const handleSelectChat = async (id: string) => {
        const user = allUsers.find(user => user.id === id);
        if (!chats.some(chat => chat.id === id)) {
            try {
                if (user) {
                    const newChat = await createChat({ userId: user.id, username: user.name });
                    setChats(prevChats => [...prevChats, newChat]);
                    onSelectChat(newChat.id);
                    fetchNotifications();
                }
            } catch (error) {
                console.error('Failed to create chat:', error);
            }
        } else {
            onSelectChat(id);
        }
    };

    const handleJoinGroup = async (groupId: string, notificationId: string) => {
        try {
            await joinGroup(groupId, notificationId);
            console.log(`Joined group ${groupId}, refreshing chats...`);
            const fetchedChats = await getChats();
            setChats(fetchedChats);
            fetchNotifications();
            setIsNotificationVisible(false); // Закрываем окно после присоединения
        } catch (error) {
            console.error('Failed to join group:', error);
        }
    };

    return (
        <div className="w-full bg-[#17212b] shadow-lg min-h-screen flex flex-col relative">
            <div className="bg-[#2b5278] p-4 mb-4 h-15 flex justify-between items-center">
                <h1 className="text-white text-xl font-bold">Saturn</h1>
                {unreadCount > 0 && (
                    <button
                        onClick={() => setIsNotificationVisible(!isNotificationVisible)}
                        className="bg-red-500 text-white text-xs px-2 py-1 rounded-full"
                        title="Toggle notifications"
                    >
                        {unreadCount}
                    </button>
                )}
            </div>
            <UserSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <ChatList
                chats={chats}
                allUsers={allUsers}
                onSelectChat={handleSelectChat}
                searchQuery={searchQuery}
            />
            <div className="mt-auto">
                <Profile />
            </div>
            {isNotificationVisible && notifications.length > 0 && (
                <NotificationList
                    notifications={notifications}
                    onJoinGroup={handleJoinGroup}
                    onClose={() => setIsNotificationVisible(false)}
                />
            )}
        </div>
    );
};

export default Sidebar;