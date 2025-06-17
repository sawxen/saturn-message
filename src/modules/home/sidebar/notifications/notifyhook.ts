import * as React from 'react';
import type {Notification} from './api';
import { getNotifications, markAllAsRead } from './api';

export const useNotifications = () => {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<Error | null>(null);

    const fetchNotifications = React.useCallback(async (params = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getNotifications(params);
            setNotifications(response.notifications);
            setUnreadCount(response.total);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleMarkAllAsRead = React.useCallback(async () => {
        try {
            await markAllAsRead();
            setUnreadCount(0);
            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true }))
            );
        } catch (err) {
            console.error('Failed to mark notifications as read:', err);
        }
    }, []);

    React.useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount,
        isLoading,
        error,
        fetchNotifications,
        markAllAsRead: handleMarkAllAsRead,
    };
};