import * as React from 'react';
import axiosInstance from '../../api/axiosInstance';
import type { Notification } from '../../api/types';

interface NotificationListProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    onJoinGroup: (groupId: string, notificationId: string) => void;
    onSelectChat: (chatId: string) => void;
    onChatsUpdated?: () => void; // New callback to refresh chats
}

const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    try {
        console.log(`Marking notification ${notificationId} as read at: ${axiosInstance.defaults.baseURL}/notifications/${notificationId}/read`);
        await axiosInstance.patch(`/notifications/${notificationId}/read`);
        console.log('Notification marked as read successfully');
    } catch (error: unknown) {
        console.error('Failed to mark notification as read:', error);
        throw new Error('Не удалось отметить уведомление как прочитанное');
    }
};

const NotificationList: React.FC<NotificationListProps> = ({
                                                               isOpen,
                                                               onClose,
                                                               notifications,
                                                               onJoinGroup,
                                                               onSelectChat,
                                                               onChatsUpdated,
                                                           }) => {
    const [localNotifications, setLocalNotifications] = React.useState<Notification[]>(notifications);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        setLocalNotifications(notifications);
    }, [notifications]);

    const unreadCount = localNotifications.filter((n) => !n.read).length;

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            try {
                await markNotificationAsRead(notification._id);
                setLocalNotifications((prev) =>
                    prev.map((n) =>
                        n._id === notification._id ? { ...n, read: true } : n
                    )
                );
                setError(null);
            } catch (err) {
                setError('Не удалось отметить уведомление как прочитанное');
                console.error(err);
            }
        }

        if (notification.type === 'group_invite' && notification.payload?.groupId) {
            onJoinGroup(notification.payload.groupId, notification._id);
            onSelectChat(notification.payload.groupId);
            if (onChatsUpdated) {
                onChatsUpdated(); // Trigger chat list refresh
            }
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-700/50">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-semibold text-white tracking-wide">
                            Уведомления
                            {unreadCount > 0 && (
                                <span className="ml-2 text-xs bg-red-500 px-2 py-1 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm text-center mb-4">{error}</p>
                    )}

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {localNotifications.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                У вас нет уведомлений
                            </div>
                        ) : (
                            localNotifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                                        notification.read
                                            ? 'bg-gray-700/50 hover:bg-gray-700'
                                            : 'bg-blue-900/20 hover:bg-blue-900/30'
                                    }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-white font-medium">
                                                {notification.type === 'group_invite'
                                                    ? `Приглашение в группу`
                                                    : notification.type}
                                            </p>
                                            <p className="text-gray-300 text-sm mt-1">
                                                {notification.payload?.content ||
                                                    'Новое уведомление'}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <span className="text-xs bg-blue-500 px-2 py-0.5 rounded-full">
                                                Новое
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2">
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={onClose}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200"
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationList;