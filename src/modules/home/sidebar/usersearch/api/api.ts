import axiosInstance from './axiosInstance';
import type { Chat, User } from '../../Sidebar';
import type { AxiosError } from 'axios';

// Получение чатов
export const getChats = async (): Promise<Chat[]> => {
    try {
        console.log('Fetching chats from:', axiosInstance.defaults.baseURL + '/users/me/groups');
        const { data } = await axiosInstance.get('/users/me/groups');
        console.log('Chats response:', data);
        return data.map((chat: any) => ({
            id: chat._id || chat.id,
            name: chat.payload?.name || chat.name || 'Unknown',
            lastMessage: chat.lastMessage || 'No messages yet'
        }));
    } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message: string }>;
        console.error('Failed to fetch chats:', axiosError.response?.data || axiosError.message);
        return [];
    }
};

// Создание нового чата и приглашение
export const createChat = async (user: { userId: string; username: string }): Promise<Chat> => {
    try {
        const groupName = `Chat with ${user.username}`;
        console.log('Creating chat with name:', groupName, 'and type: private', 'from:', axiosInstance.defaults.baseURL + '/groups');
        const { data: groupData } = await axiosInstance.post('/groups', {
            name: groupName,
            type: 'private',
            joinMode: 'invite' // Убедимся, что режим установлен как invite
        });

        // Получаем ID роли "Обычный пользователь" (предполагаем, что она создается автоматически)
        const defaultRoleId = (groupData.payload?.settings?.defaultRole || 'default_role_id'); // Замените на реальный ID роли, если требуется

        // Отправка приглашения
        console.log('Inviting user:', user.userId, 'to group:', groupData._id || groupData.id);
        const { data: inviteData } = await axiosInstance.post(`/groups/${groupData._id || groupData.id}/invite`, {
            userId: user.userId,
            roleId: defaultRoleId // Присваиваем роль "Обычный пользователь"
        });
        const notificationId = inviteData.notificationId;

        // Временное решение: выводим notificationId для другого пользователя
        console.log(`Invitation sent! Please share this notificationId with the other user: ${notificationId}. They can join with groupId: ${groupData._id || groupData.id}`);

        console.log('Chat created:', groupData);
        return {
            id: groupData._id || groupData.id,
            name: groupData.payload?.name || groupData.name || groupName,
            lastMessage: groupData.lastMessage || 'No messages yet'
        };
    } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message: string[] }>;
        console.error('Failed to create chat or invite:', axiosError.response?.data?.message || axiosError.response?.data || axiosError.message);
        throw error;
    }
};

// Поиск пользователей
export const searchUsers = async (query: string): Promise<User[]> => {
    try {
        if (query.length < 3) {
            console.log('Query too short, minimum 3 characters required');
            return [];
        }
        console.log(`Searching users with query: ${query} from:`, axiosInstance.defaults.baseURL + '/users/search');
        const params = { query: encodeURIComponent(query) };
        const { data } = await axiosInstance.get('/users/search', { params });
        console.log('Users response (raw):', data);
        const users = Array.isArray(data) ? data : data.data || [];
        console.log('Mapped users:', users.map((user: any) => ({
            id: user._id,
            name: user.username || user.public?.displayName || user.displayName || 'Unnamed'
        })));
        return users.map((user: any) => ({
            id: user._id,
            name: user.username || user.public?.displayName || user.displayName || 'Unnamed'
        }));
    } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message: string }>;
        console.error('Failed to search users:', {
            status: axiosError.response?.status,
            data: axiosError.response?.data,
            message: axiosError.message,
            config: axiosError.config
        });
        return [];
    }
};

// Получение сообщений
export const getMessages = async (chatId: string, page = 1, limit = 50): Promise<any[]> => {
    try {
        const params = { page, limit };
        console.log(`Fetching messages from: ${axiosInstance.defaults.baseURL}/groups/${chatId}/messages`, params);
        const { data } = await axiosInstance.get(`/groups/${chatId}/messages`, { params });
        console.log('Messages response:', data);
        return data.messages || [];
    } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message: string }>;
        console.error('Failed to fetch messages:', axiosError.response?.data || axiosError.message);
        return [];
    }
};

// Отправка сообщени
export const sendMessage = async (chatId: string, text: string): Promise<void> => {
    try {
        console.log(`Sending message to: ${axiosInstance.defaults.baseURL}/groups/${chatId}/messages`);
        await axiosInstance.post(`/groups/${chatId}/messages`, {
            type: 'text',
            payload: text
        });
        console.log('Message sent successfully');
    } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message: string }>;
        console.error('Failed to send message:', axiosError.response?.data || axiosError.message);
        throw error;
    }
};
