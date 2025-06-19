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
import type {Chat, User} from '../api/types.ts';

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
    text: string;
    sender: 'me' | 'them';
    timestamp: string;
    status?: 'sent' | 'delivered' | 'read';
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
    const [sidebarWidth, setSidebarWidth] = React.useState<number>(320); // Начальная ширина
    const minWidth = 200; // Минимальная ширина
    const maxWidth = window.innerWidth * 0.7; // Максимальная ширина 70% экрана
    const adaptiveWidth = 80; // Фиксированная ширина адаптивной версии
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
            const user = allUsers.find((user) => user.id === id);
            if (!chats.some((chat) => chat.id === id)) {
                if (user) {
                    const newChat = await createChat({
                        userId: user.id,
                        username: user.name,
                    });
                    setChats((prevChats) => [...prevChats, newChat]);
                    setSelectedChatId(newChat.id);
                    onSelectChat(newChat.id);
                    if (onChatNameChange) onChatNameChange(newChat.name);
                    await fetchNotifications();
                }
            } else {
                setSelectedChatId(id);
                onSelectChat(id);
                const chatName = chats.find((chat) => chat.id === id)?.name || 'Чат';
                if (onChatNameChange) onChatNameChange(chatName);
            }
        } catch (error) {
            console.error('Ошибка выбора чата:', error);
        }
    };

    const handleJoinGroup = async (groupId: string, notificationId: string) => {
        try {
            await joinGroup(groupId, notificationId);
            const fetchedChats = await getChats();
            setChats(fetchedChats);
            await fetchNotifications();
            setIsNotificationVisible(false);
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

            // Если ширина меньше minWidth, сразу переключаем в компактный режим
            if (newWidth < minWidth) {
                setSidebarWidth(adaptiveWidth); // Сворачиваем без ожидания onMouseUp
                return; // Прекращаем дальнейшие изменения
            }

            // Иначе ограничиваем максимальной шириной
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
                        <FiMenu className="text-lg" />
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

            {isNotificationVisible && notifications.length > 0 && (
                <NotificationList
                    notifications={notifications}
                    onJoinGroup={handleJoinGroup}
                    onClose={() => setIsNotificationVisible(false)}
                />
            )}

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