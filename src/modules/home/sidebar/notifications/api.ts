import axiosInstance from '../../api/axiosInstance.ts';
import type {AxiosError} from "axios";

export interface Notification {
    _id: string;
    userId: string;
    type: 'contact_request' | 'mention' | 'group_invite' | 'reaction';
    payload: {
        requesterId?: string;
        groupId?: string;
        roleId?: string;
        messageId?: string;
        content?: string;
    };
    read: boolean;
    createdAt: string;
}

export interface NotificationsResponse {
    notifications: Notification[];
    total: number;
}

export const getNotifications = async (params: {
    limit?: number;
    offset?: number;
    read?: boolean;
} = {}): Promise<NotificationsResponse> => {
    try {
        const response = await axiosInstance.get<NotificationsResponse>('/users/me/notifications', {
            params: {
                limit: params.limit || 10,
                offset: params.offset || 0,
                read: params.read,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        throw error;
    }
};

export const markAllAsRead = async (): Promise<{ count: number }> => {
    try {
        const { notifications } = await getNotifications({ read: false, limit: 100 });
        await Promise.all(
            notifications.map(notification =>
                axiosInstance.put(`/users/me/notifications/${notification._id}`, { read: true })
            )
        );
        return { count: notifications.length };
    } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        throw error;
    }
};

export const joinGroup = async (groupId: string, notificationId: string): Promise<void> => {
    try {
        console.log(`Joining group ${groupId} with notificationId: ${notificationId}`);
        await axiosInstance.post(`/groups/${groupId}/join`, {
            notificationId
        });
        console.log('Successfully joined group');
    } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message: string }>;
        console.error('Failed to join group:', axiosError.response?.data || axiosError.message);
        throw error;
    }
};