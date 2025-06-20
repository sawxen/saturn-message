import * as React from 'react';
import UserSearch from './usersearch/UserSearch';
import ChatList from './chatlist/ChatList';
import { getChats, searchUsers, createChat } from '../api/api.ts';
import { useDebounce } from 'use-debounce';
import { useNotifications } from './notifications/notifyhook';
import NotificationList from './notifications/NotificationsList';
import { joinGroup } from './notifications/api';
import { FiMenu } from 'react-icons/fi';
import LeftSidebar from './leftsidebar/LeftSidebar';
import type { Chat, User } from '../api/types.ts';

interface SidebarProps {
    onSelectChat: (id: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onChatNameChange?: (chatName: string) => void;
    onCreateGroupClick?: () => void;
    onContactsClick?: () => void;
    onSettingsClick?: () => void;
    currentUser?: User;
}

export interface Message {
    id: string;
    text: string;
    sender: 'me' | 'them';
    timestamp: Date;
    status?: 'sent' | 'delivered' | 'read';
    isEditable?: boolean;
    file?: {
        id: string;
        name: string;
        size: number;
        type: string;
    };
}

const Sidebar: React.FC<SidebarProps> = ({
                                             onSelectChat,
                                             searchQuery,
                                             setSearchQuery,
                                             onChatNameChange,
                                             onCreateGroupClick = () => {},
                                             onContactsClick = () => {},
                                             onSettingsClick = () => {},
                                             currentUser,
                                         }) => {
    const [chats, setChats] = React.useState<Chat[]>([]);
    const [allUsers, setAllUsers] = React.useState<User[]>([]);
    const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
    const [, setSelectedChatId] = React.useState<string | null>(null);
    const { notifications, fetchNotifications } = useNotifications();
    const [isNotificationVisible, setIsNotificationVisible] = React.useState(false);
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = React.useState(false);
    const [sidebarWidth, setSidebarWidth] = React.useState<number>(320);
    const minWidth = 200;
    const maxWidth = window.innerWidth * 0.7;
    const adaptiveWidth = 80;
    const sidebarRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const fetchChats = async () => {
            try {
                const fetchedChats = await getChats();
                setChats(fetchedChats);
            } catch (error) {
                console.error('Ошибка загрузки чатов:', error);
            }
        };
        fetchChats();
    }, []);

    React.useEffect(() => {
        const fetchUsers = async () => {
            if (debouncedSearchQuery && debouncedSearchQuery.length >= 3) {
                try {
                    const fetchedUsers = await searchUsers(debouncedSearchQuery);
                    setAllUsers(fetchedUsers);
                } catch (error) {
                    console.error('Ошибка поиска пользователей:', error);
                }
            } else {
                setAllUsers([]);
            }
        };
        fetchUsers();
    }, [debouncedSearchQuery]);

    const handleSelectChat = async (id: string) => {
        try {
            const existingChat = chats.find((chat) => chat.id === id);
            const user = allUsers.find((user) => user.id === id);

            if (!existingChat && user) {
                // Create a new chat with a user
                const newChat = await createChat({
                    userId: user.id,
                    username: user.name,
                });
                setChats((prevChats) => {
                    if (!prevChats.some((chat) => chat.id === newChat.id)) {
                        return [...prevChats, newChat];
                    }
                    return prevChats;
                });
                setSelectedChatId(newChat.id);
                onSelectChat(newChat.id);
                if (onChatNameChange) onChatNameChange(newChat.name);
            } else if (existingChat) {
                // Select an existing chat
                setSelectedChatId(id);
                onSelectChat(id);
                if (onChatNameChange) onChatNameChange(existingChat.name);
            } else {
                // Possibly a group chat not yet in chats
                const fetchedChats = await getChats();
                const groupChat = fetchedChats.find((chat) => chat.id === id);
                if (groupChat) {
                    setChats((prevChats) => {
                        if (!prevChats.some((chat) => chat.id === groupChat.id)) {
                            return [...prevChats, groupChat];
                        }
                        return prevChats;
                    });
                    setSelectedChatId(id);
                    onSelectChat(id);
                    if (onChatNameChange) onChatNameChange(groupChat.name);
                } else {
                    console.warn(`Chat with ID ${id} not found`);
                }
            }
            await fetchNotifications();
        } catch (error) {
            console.error('Ошибка выбора чата:', error);
        }
    };

    const handleJoinGroup = async (groupId: string, notificationId: string) => {
        try {
            await joinGroup(groupId, notificationId);
            const fetchedChats = await getChats();
            setChats((prevChats) => {
                // Update chats, avoiding duplicates
                const updatedChats = fetchedChats.filter(
                    (newChat) => !prevChats.some((chat) => chat.id === newChat.id)
                );
                return [...prevChats, ...updatedChats];
            });
            await fetchNotifications();
            setIsNotificationVisible(false);
            await handleSelectChat(groupId);
        } catch (error) {
            console.error('Ошибка присоединения к группе:', error);
        }
    };

    const startResizing = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        const startX = e.pageX;
        const startWidth = sidebarWidth;

        const onMouseMove = (e: MouseEvent) => {
            const deltaX = e.pageX - startX;
            let newWidth = startWidth + deltaX;

            if (newWidth < minWidth) {
                setSidebarWidth(adaptiveWidth);
                return;
            }

            if (newWidth > maxWidth) {
                newWidth = maxWidth;
            }

            setSidebarWidth(newWidth);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    return (
        <div
            ref={sidebarRef}
            className={`flex flex-col h-screen bg-gray-800 border-r border-gray-900 relative`}
            style={{ width: `${sidebarWidth}px` }}
        >
            <div className="p-3 flex items-center">
                {sidebarWidth >= minWidth ? (
                    <>
                        <button
                            onClick={() => setIsLeftSidebarOpen(true)}
                            className="p-2 text-gray-400 hover:text-white transition-colors duration-200 mr-2"
                            title="Меню"
                        >
                            <FiMenu className="text-2xl" />
                        </button>
                        <div className="flex-1">
                            <UserSearch
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                            />
                        </div>
                    </>
                ) : (
                    <button
                        onClick={() => setIsLeftSidebarOpen(true)}
                        className="p-2 text-gray-400 hover:text-white transition-colors duration-200 mx-auto"
                        title="Меню"
                    >
                        <FiMenu className="text-2xl" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                <ChatList
                    chats={chats}
                    allUsers={allUsers}
                    onSelectChat={handleSelectChat}
                    searchQuery={searchQuery}
                    isExpanded={sidebarWidth >= minWidth}
                />
            </div>

            <NotificationList
                isOpen={isNotificationVisible}
                notifications={notifications}
                onJoinGroup={handleJoinGroup}
                onClose={() => setIsNotificationVisible(false)}
                onSelectChat={handleSelectChat}
            />

            {currentUser && (
                <LeftSidebar
                    currentUser={currentUser}
                    isOpen={isLeftSidebarOpen}
                    onClose={() => setIsLeftSidebarOpen(false)}
                    onCreateGroupClick={onCreateGroupClick}
                    onContactsClick={onContactsClick}
                    onSettingsClick={onSettingsClick}
                />
            )}

            <div
                onMouseDown={startResizing}
                className="absolute right-0 top-0 h-full w-1 bg-transparent cursor-col-resize"
                style={{ touchAction: 'none' }}
            />
        </div>
    );
};

export default Sidebar;