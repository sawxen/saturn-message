import * as React from 'react';
import type { Chat, User } from '../../api/types.ts';
import { FiClock, FiMessageSquare, FiUserPlus, FiCheck } from 'react-icons/fi';
import { IoCheckmarkDone } from 'react-icons/io5';
import { getMessages } from '../../api/api.ts';

interface ChatListProps {
    chats: Chat[];
    allUsers: User[];
    onSelectChat: (id: string) => void;
    searchQuery: string;
    isExpanded: boolean;
}

const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getStatusIcon = (status?: 'sent' | 'delivered' | 'read') => {
    switch (status) {
        case 'read':
            return <IoCheckmarkDone className="text-blue-400 inline" />;
        case 'delivered':
            return <FiCheck className="text-gray-400 inline" />;
        case 'sent':
            return <FiCheck className="text-gray-400 inline opacity-50" />;
        default:
            return null;
    }
};

const ChatList: React.FC<ChatListProps> = ({
                                               chats,
                                               allUsers,
                                               onSelectChat,
                                               searchQuery,
                                               isExpanded
                                           }) => {
    const [lastMessages, setLastMessages] = React.useState<Record<string, any>>({});
    const [loadingMessages, setLoadingMessages] = React.useState<Record<string, boolean>>({});
    const [errorMessages, setErrorMessages] = React.useState<Record<string, string>>({});

    // Функция для загрузки последнего сообщения
    const loadLastMessage = React.useCallback(async (chatId: string) => {
        if (loadingMessages[chatId] || lastMessages[chatId]) return;

        try {
            setLoadingMessages(prev => ({ ...prev, [chatId]: true }));
            const messages = await getMessages(chatId, 1, 1);
            if (messages.length > 0) {
                setLastMessages(prev => ({ ...prev, [chatId]: messages[0] }));
            }
        } catch (error) {
            setErrorMessages(prev => ({ ...prev, [chatId]: 'Не удалось загрузить сообщение' }));
            console.error(`Failed to load last message for chat ${chatId}:`, error);
        } finally {
            setLoadingMessages(prev => ({ ...prev, [chatId]: false }));
        }
    }, [loadingMessages, lastMessages]);

    // Эффект для загрузки последних сообщений при изменении списка чатов
    React.useEffect(() => {
        if (isExpanded) {
            chats.forEach(chat => {
                if (!chat.lastMessage) {
                    loadLastMessage(chat.id);
                }
            });
        }
    }, [chats, isExpanded, loadLastMessage]);

    const filteredChats = searchQuery
        ? chats.filter(chat =>
            chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (chat.lastMessage?.text?.toLowerCase().includes(searchQuery.toLowerCase()) || false))
        : chats;

    const filteredUsers = searchQuery
        ? allUsers.filter(user =>
            !chats.some(chat => chat.id === user.id) &&
            user.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : [];

    // Функция для получения последнего сообщения чата
    const getChatLastMessage = (chat: Chat) => {
        // Если есть в пропсах
        if (chat.lastMessage) return chat.lastMessage;

        // Если загружено отдельно
        const loadedMessage = lastMessages[chat.id];
        if (loadedMessage) {
            return {
                text: loadedMessage.payload?.payload || 'Нет сообщений',
                timestamp: loadedMessage.createdAt,
                sender: loadedMessage.senderId === 'me' ? 'me' : 'them',
                status: loadedMessage.status || 'sent'
            };
        }

        // Если идет загрузка
        if (loadingMessages[chat.id]) {
            return { text: 'Загрузка...', timestamp: new Date().toISOString() };
        }

        // Если ошибка
        if (errorMessages[chat.id]) {
            return { text: errorMessages[chat.id], timestamp: new Date().toISOString() };
        }

        return null;
    };

    if (!isExpanded) {
        return (
            <div className="flex flex-col items-center py-4 space-y-4">
                {chats.slice(0, 5).map(chat => (
                    <button
                        key={chat.id}
                        onClick={() => onSelectChat(chat.id)}
                        className="relative p-2 rounded-full bg-gray-700 hover:bg-blue-500 transition-colors"
                        title={chat.name}
                    >
                        {chat.avatar ? (
                            <img src={chat.avatar} alt={chat.name} className="w-8 h-8 rounded-full" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                {chat.name.charAt(0)}
                            </div>
                        )}
                        {typeof chat.unreadCount === 'number' && chat.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                {chat.unreadCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            {/* Существующие чаты */}
            <div className="px-3 py-2">
                <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 px-2 flex items-center">
                    <FiMessageSquare className="mr-2" />
                    {filteredChats.length > 0 ? 'Ваши чаты' : 'Нет чатов'}
                </h2>

                {filteredChats.length > 0 ? (
                    <div className="space-y-1">
                        {filteredChats.map(chat => {
                            const lastMessage = getChatLastMessage(chat);
                            return (
                                <button
                                    key={chat.id}
                                    onClick={() => onSelectChat(chat.id)}
                                    className="w-full flex items-center p-2 rounded-lg hover:bg-gray-700/50 transition-colors group"
                                >
                                    <div className="relative mr-3">
                                        {chat.avatar ? (
                                            <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                                                {chat.name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="text-white font-medium truncate">{chat.name}</p>
                                        <p className="text-xs text-gray-400 truncate flex items-center">
                                            {lastMessage?.sender === 'me' && lastMessage?.status && (
                                                <span className="mr-1">
                                                    {getStatusIcon(lastMessage.status)}
                                                </span>
                                            )}
                                            {lastMessage?.text || 'Нет сообщений'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end ml-2">
                                        <span className="text-xs text-gray-400 group-hover:text-gray-300">
                                            {lastMessage?.timestamp ? (
                                                formatTime(lastMessage.timestamp)
                                            ) : (
                                                <FiClock className="inline" />
                                            )}
                                        </span>
                                        {typeof chat.unreadCount === 'number' && chat.unreadCount > 0 && (
                                            <span className="text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5 mt-1">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm px-2 py-4 text-center">
                        {searchQuery ? 'Чаты не найдены' : 'У вас пока нет чатов'}
                    </p>
                )}
            </div>

            {/* Новые контакты */}
            {searchQuery && filteredUsers.length > 0 && (
                <div className="border-t border-gray-700/50 px-3 py-2">
                    <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 px-2 flex items-center">
                        <FiUserPlus className="mr-2" />
                        Новые контакты
                    </h2>
                    <div className="space-y-1">
                        {filteredUsers.map(user => (
                            <button
                                key={user.id}
                                onClick={() => onSelectChat(user.id)}
                                className="w-full flex items-center p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                            >
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full mr-3" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium mr-3">
                                        {user.name.charAt(0)}
                                    </div>
                                )}
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-white font-medium truncate">{user.name}</p>
                                    <p className="text-xs text-gray-400">Начать чат</p>
                                </div>
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                                    Новый
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatList;