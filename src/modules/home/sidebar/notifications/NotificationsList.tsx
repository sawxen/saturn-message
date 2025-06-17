import * as React from 'react';
import type { Notification } from './api';

interface NotificationListProps {
    notifications: Notification[];
    onJoinGroup: (groupId: string, notificationId: string) => void;
    onClose: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ notifications, onJoinGroup, onClose }) => {
    if (!notifications.length) return null;

    return (
        <div className="absolute top-16 right-4 w-64 bg-[#1e2a38] rounded-lg shadow-lg p-2 z-10">
            <div className="flex justify-between items-center">
                <h3 className="text-white text-sm font-semibold mb-2">Уведомления</h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            {notifications.map((notification) => (
                <div
                    key={notification._id}
                    className="p-2 mb-1 bg-[#242f3d] rounded text-white text-sm cursor-pointer hover:bg-[#2b5278]"
                    onClick={() => {
                        if (notification.type === 'group_invite' && notification.payload?.groupId && notification._id) {
                            onJoinGroup(notification.payload.groupId, notification._id);
                        }
                    }}
                >
                    {notification.type === 'group_invite'
                        ? `Приглашение в группу: ${notification.payload?.content || 'Без названия'}`
                        : notification.type}
                    {!notification.read && <span className="ml-2 text-xs bg-red-500 px-1 rounded-full">Новое</span>}
                </div>
            ))}
        </div>
    );
};

export default NotificationList;