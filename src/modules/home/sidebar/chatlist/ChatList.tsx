import * as React from 'react';
import type { Chat, User } from '../Sidebar';

interface ChatListProps {
    chats: Chat[];
    allUsers: User[];
    onSelectChat: (id: string) => void;
    searchQuery: string;
}

const ChatList: React.FC<ChatListProps> = ({ chats, allUsers, onSelectChat, searchQuery }) => {
    console.log('Rendering ChatList - searchQuery:', searchQuery, 'allUsers:', allUsers);

    // Фильтрация существующих чатов по поисковому запросу (по name)
    const filteredChats = searchQuery
        ? chats.filter(chat =>
            chat.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : chats;

    // Фильтрация новых пользователей, исключая тех, кто уже в чатах
    const filteredUsers = searchQuery
        ? allUsers.filter(user =>
            !chats.some(chat => chat.id === user.id) &&
            user.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    return (
        <div className="flex-1 overflow-y-auto px-4">
            {/* Секция существующих чатов */}
            <div className="mb-4">
                <h2 className="text-white text-sm font-semibold mb-2">Чаты</h2>
                {filteredChats.length > 0 ? (
                    filteredChats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => onSelectChat(chat.id)}
                            className="flex items-center p-2 mb-2 bg-[#242f3d] rounded-lg cursor-pointer hover:bg-[#2b5278] transition-colors"
                        >
                            <div className="w-10 h-10 bg-gray-600 rounded-full mr-3"></div>
                            <div className="flex-1">
                                <p className="text-white font-medium">{chat.name}</p>
                                <p className="text-xs text-gray-400">{chat.lastMessage}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400 text-sm">У вас пока нет чатов.</p>
                )}
            </div>

            {/* Секция новых пользователей (отображается только при поиске) */}
            {searchQuery && filteredUsers.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-white text-sm font-semibold mb-2">Новые пользователи</h2>
                    {filteredUsers.map(user => (
                        <div
                            key={user.id}
                            onClick={() => onSelectChat(user.id)} // Открываем чат с новым пользователем
                            className="flex items-center p-2 mb-2 bg-[#242f3d] rounded-lg cursor-pointer hover:bg-[#2b5278] transition-colors"
                        >
                            <div className="w-10 h-10 bg-gray-600 rounded-full mr-3"></div>
                            <div className="flex-1">
                                <p className="text-white font-medium">{user.name}</p>
                                <p className="text-xs text-gray-400">Создать чат</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChatList;