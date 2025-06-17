import * as React from 'react';
import type { Notification } from './api';

interface NotificationListProps {
    notifications: Notification[];
    onJoinGroup: (groupId: string, notificationId: string) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ notifications, onJoinGroup }) => {
    if (!notifications.length) return null;

    return (
        <div className="absolute top-16 right-4 w-64 bg-[#1e2a38] rounded-lg shadow-lg p-2 z-10">
            <h3 className="text-white text-sm font-semibold mb-2">Уведомления</h3>
            {notifications.map((notification) => (
                <div
                    key={notification._id}
                    className="p-2 mb-1 bg-[#242f3d] rounded text-white text-sm cursor-pointer hover:bg-[#2b5278]"
                    onClick={() => {
                        if (notification.type === 'group_invite' && notification.payload.groupId && notification._id) {
                            onJoinGroup(notification.payload.groupId, notification._id);
                        }
                    }}
                >
                    {notification.type === 'group_invite'
                        ? `Приглашение в группу: ${notification.payload.content || 'Без названия'}`
                        : notification.type}
                    {!notification.read && <span className="ml-2 text-xs bg-red-500 px-1 rounded-full">Новое</span>}
                </div>
            ))}
        </div>
    );
};

export default NotificationList;