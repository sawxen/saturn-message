import * as React from 'react';
import {
    getMessages,
    sendMessage,
    updateMessage,
    deleteMessage,
    deleteChat,
    getMembers,
    getProfile,
    addContact,
    uploadFile,
    getFileDownloadUrl,
} from '../api/api.ts';
import axiosInstance from '../api/axiosInstance.ts';
import {
    FiMoreHorizontal,
    FiCheck,
    FiEdit2,
    FiTrash2,
    FiPaperclip,
    FiX,
    FiUsers,
    FiCalendar,
    FiSmile,
    FiMic,
    FiDownload,
    FiFileText,
    FiImage,
    FiPlay,
    FiStopCircle,
} from 'react-icons/fi';
import { IoCheckmarkDone } from 'react-icons/io5';
import type { GroupMember, UserProfile } from '../api/types';

interface Message {
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
        url: string;
    };
}

interface ChatAreaProps {
    selectedChatId: string | null;
    chatName?: string;
    onChatDeleted?: (chatId: string) => void;
}

interface MessageGroup {
    date: string;
    messages: Message[];
}

const mapMessages = (fetchedMessages: any[], currentUserId: string | null): Message[] => {
    return fetchedMessages.map((msg: any): Message => {
        const isFile = msg.payload?.type === 'file' || msg.payload?.type === 'audio' || (msg.payload?.payload && typeof msg.payload?.payload === 'string' && msg.payload?.payload.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i));
        return {
            id: msg._id,
            text: isFile ? (msg.payload?.payload || 'Файл/Аудио') : (msg.payload?.payload || 'Нет содержимого'),
            sender: msg.senderId === currentUserId ? 'me' : 'them',
            timestamp: new Date(msg.createdAt),
            status: msg.senderId === currentUserId ? 'delivered' : undefined,
            isEditable: msg.senderId === currentUserId && !isFile,
            file: isFile
                ? {
                    id: msg.payload?.payload || msg.text || 'unknown',
                    name: msg.payload?.name || (msg.payload?.type === 'audio' ? 'voice_message.mp3' : 'Unnamed file'),
                    size: msg.payload?.size || 0,
                    type: msg.payload?.type || (msg.payload?.payload ? msg.payload?.payload.split('.').pop() || 'unknown' : 'unknown'),
                    url: getFileDownloadUrl(msg.payload?.payload || msg.text || 'unknown'),
                }
                : undefined,
        };
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

const formatMessageDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Вчера';
    } else {
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }
};

const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const groupMessagesByDate = (messages: Message[]): MessageGroup[] => {
    if (messages.length === 0) return [];

    const groups: MessageGroup[] = [];
    let currentDate = formatMessageDate(messages[0].timestamp);
    let currentGroup: Message[] = [];

    messages.forEach((message, index) => {
        const messageDate = formatMessageDate(message.timestamp);

        if (messageDate !== currentDate) {
            groups.push({
                date: currentDate,
                messages: currentGroup,
            });
            currentDate = messageDate;
            currentGroup = [message];
        } else {
            currentGroup.push(message);
        }

        if (index === messages.length - 1) {
            groups.push({
                date: currentDate,
                messages: currentGroup,
            });
        }
    });

    return groups;
};

const DateDivider: React.FC<{ date: string }> = ({ date }) => {
    return (
        <div className="flex items-center my-4 px-2">
            <div className="flex-1 border-t border-gray-700"></div>
            <span className="px-3 text-xs text-gray-400 font-medium">{date}</span>
            <div className="flex-1 border-t border-gray-700"></div>
        </div>
    );
};

const ChatHeader: React.FC<{ chatName: string; onMenuClick: () => void }> = ({ chatName, onMenuClick }) => {
    return (
        <div className="flex items-center justify-between h-20 p-4 bg-gray-800 border-b border-[#242f3d]">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-medium text-lg">{chatName.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                    <h2 className="text-white font-medium">{chatName}</h2>
                    <p className="text-xs text-gray-400">В сети</p>
                </div>
            </div>
            <button onClick={onMenuClick} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors">
                <FiMoreHorizontal size={20} />
            </button>
        </div>
    );
};

const MessageBubble: React.FC<{
    message: Message;
    onEdit?: (id: string, text: string) => void;
    onDelete?: (id: string) => void;
    isOwnMessage: boolean;
}> = ({ message, onEdit, onDelete, isOwnMessage }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editedText, setEditedText] = React.useState(message.text);
    const [showContextMenu, setShowContextMenu] = React.useState(false);
    const [menuPosition, setMenuPosition] = React.useState<'top' | 'bottom'>('bottom');
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const audioRef = React.useRef<HTMLAudioElement>(null);
    const bubbleRef = React.useRef<HTMLDivElement>(null);
    const menuRef = React.useRef<HTMLDivElement>(null);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isOwnMessage && !isEditing && !message.file) {
            setShowContextMenu(true);
            if (bubbleRef.current) {
                const rect = bubbleRef.current.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const spaceBelow = windowHeight - rect.bottom;
                const menuHeight = 80;
                setMenuPosition(spaceBelow < menuHeight ? 'top' : 'bottom');
            }
        }
    };

    const closeContextMenu = () => {
        setShowContextMenu(false);
    };

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                bubbleRef.current &&
                !bubbleRef.current.contains(e.target as Node) &&
                menuRef.current &&
                !menuRef.current.contains(e.target as Node)
            ) {
                closeContextMenu();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeContextMenu();
            }
        };

        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const handleEdit = () => {
        if (!message.file) {
            setEditedText(message.text);
            setIsEditing(true);
            closeContextMenu();
        }
    };

    const handleSave = () => {
        if (onEdit && editedText.trim() && editedText !== message.text && !message.file) {
            onEdit(message.id, editedText);
        }
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (onDelete && window.confirm('Вы уверены, что хотите удалить это сообщение?')) {
            onDelete(message.id);
        }
        closeContextMenu();
    };

    const handleDownload = async () => {
        if (message.file && !isDownloading) {
            setIsDownloading(true);
            try {
                const link = document.createElement('a');
                link.href = message.file.url;
                link.download = message.file.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                console.error('Ошибка при скачивании файла:', error);
            } finally {
                setIsDownloading(false);
            }
        }
    };

    const handlePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const getStatusIcon = () => {
        switch (message.status) {
            case 'read':
                return <IoCheckmarkDone className="text-blue-400 ml-1" />;
            case 'delivered':
                return <FiCheck className="text-gray-400 ml-1" />;
            default:
                return null;
        }
    };

    const getFileIcon = () => {
        if (!message.file) return null;
        const extension = message.file.type.toLowerCase();
        if (extension.startsWith('image/')) return <FiImage className="text-blue-400" />;
        if (extension.startsWith('audio/')) return <FiMic className="text-green-400" />;
        return <FiFileText className="text-gray-400" />;
    };

    return (
        <div
            className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'} mb-3 px-2 relative`}
            onContextMenu={handleContextMenu}
            ref={bubbleRef}
        >
            <div className="relative">
                {isEditing ? (
                    <div className={`p-3 rounded-2xl ${message.sender === 'me' ? 'bg-blue-700' : 'bg-gray-600'}`}>
                        <input
                            type="text"
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="w-full bg-transparent text-white focus:outline-none mb-2"
                            autoFocus
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="text-xs text-gray-300 hover:text-white px-2 py-1 rounded"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleSave}
                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                            >
                                Сохранить
                            </button>
                        </div>
                    </div>
                ) : message.file ? (
                    <div
                        className={`p-3 rounded-2xl ${message.sender === 'me' ? 'bg-sky-800 rounded-tr-none' : 'bg-gray-800 rounded-tl-none'}`}
                    >
                        <div className="flex items-center space-x-3">
                            {getFileIcon()}
                            <div className="flex-1">
                                <p className="text-white font-medium truncate max-w-xs">{message.file.name}</p>
                                <p className="text-xs text-gray-300">
                                    {message.file.type} • {formatFileSize(message.file.size)}
                                </p>
                            </div>
                            {message.file.type.startsWith('audio/') ? (
                                <button
                                    onClick={handlePlayPause}
                                    className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
                                >
                                    {isPlaying ? <FiStopCircle size={18} /> : <FiPlay size={18} />}
                                </button>
                            ) : (
                                <button
                                    onClick={handleDownload}
                                    className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
                                    disabled={isDownloading}
                                >
                                    {isDownloading ? (
                                        <span className="text-xs">Загрузка...</span>
                                    ) : (
                                        <FiDownload size={18} />
                                    )}
                                </button>
                            )}
                        </div>
                        {message.file.type.startsWith('image/') && (
                            <div className="mt-2">
                                <img
                                    src={message.file.url}
                                    alt={message.file.name}
                                    className="max-w-full max-h-40 rounded-lg object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                        {message.file.type.startsWith('audio/') && (
                            <audio ref={audioRef} src={message.file.url} className="hidden" />
                        )}
                        <div className="flex items-center justify-end mt-2 space-x-1">
                            <span className="text-xs text-gray-300">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {message.sender === 'me' && getStatusIcon()}
                        </div>
                    </div>
                ) : (
                    <div
                        className={`p-3 rounded-2xl ${message.sender === 'me'
                            ? 'bg-sky-800 rounded-tr-none'
                            : 'bg-gray-800 rounded-tl-none'}`}
                    >
                        <div className="text-white text-sm">{message.text}</div>
                        <div className="flex items-center justify-end mt-1 space-x-1">
                            <span className="text-xs text-gray-300">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {message.sender === 'me' && getStatusIcon()}
                        </div>
                    </div>
                )}
            </div>

            {showContextMenu && isOwnMessage && !isEditing && !message.file && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={closeContextMenu}
                    ></div>
                    <div
                        ref={menuRef}
                        className={`absolute z-50 bg-gray-700 rounded-lg shadow-xl py-1 min-w-[120px] ${
                            message.sender === 'me' ? 'right-0' : 'left-0'
                        }`}
                        style={{
                            [menuPosition === 'top' ? 'bottom' : 'top']: menuPosition === 'top' ? 'calc(100% + 5px)' : 'calc(100% + 5px)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleEdit}
                            className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-600 flex items-center"
                        >
                            <FiEdit2 className="mr-2" size={14} />
                            Редактировать
                        </button>
                        <button
                            onClick={handleDelete}
                            className="w-full text-left px-4 py-2 text-gray-300 hover:text-red-400 hover:bg-gray-600 flex items-center"
                        >
                            <FiTrash2 className="mr-2" size={14} />
                            Удалить
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

const MessageInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    isSending: boolean;
    onFileUpload: (file: File) => void;
    onVoiceMessage: (audioBlob: Blob) => void;
}> = ({ value, onChange, onSend, isSending, onFileUpload, onVoiceMessage }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isRecording, setIsRecording] = React.useState(false);
    const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = React.useState<Blob[]>([]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileUpload(file);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !isSending) {
            e.preventDefault();
            onSend();
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);

            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const audioBlob = new Blob(chunks, { type: 'audio/mp3' });
                onVoiceMessage(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setAudioChunks(chunks);
            setIsRecording(true);
        } catch (error) {
            console.error('Ошибка при доступе к микрофону:', error);
            alert('Не удалось начать запись голосового сообщения.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
            setMediaRecorder(null);
        }
    };

    return (
        <div className="px-3 bg-gray-800 border-t border-[#242f3d] flex items-center">
            <button
                className="text-gray-400 hover:text-white p-2 mr-1 rounded-full hover:bg-gray-300 transition-colors"
                onClick={() => fileInputRef.current?.click()}
            >
                <FiPaperclip size={25} />
            </button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                accept="*/*"
            />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 px-4 py-3 mx-1 bg-transparent text-white rounded-full focus:outline-none placeholder-gray-500"
                placeholder="Сообщение..."
                onKeyDown={handleKeyDown}
                disabled={isSending}
            />
            <button className="text-gray-400 hover:text-white p-2 mx-1 rounded-full hover:text-gray-300 transition-colors">
                <FiSmile size={25} />
            </button>
            <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 mr-1 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-300'}`}
                disabled={isSending}
            >
                {isRecording ? <FiStopCircle size={25} /> : <FiMic size={25} />}
            </button>
        </div>
    );
};

const UserProfileModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile | null;
    joinedAt: string;
}> = ({ isOpen, onClose, profile, joinedAt }) => {
    const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
    const [isContact, setIsContact] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await axiosInstance.get('/users/me');
                setCurrentUserId(response.data._id);
            } catch (err) {
                console.error('Failed to fetch current user:', err);
            }
        };
        fetchCurrentUser();
    }, []);

    React.useEffect(() => {
        const checkContactStatus = async () => {
            if (profile && currentUserId && profile.id !== currentUserId) {
                try {
                    const contactsResponse = await axiosInstance.get('/users/me/contacts');
                    const contacts = Array.isArray(contactsResponse.data)
                        ? contactsResponse.data
                        : contactsResponse.data.data || [];
                    const isAlreadyContact = contacts.some((contact: { userId: string }) => contact.userId === profile.id);
                    setIsContact(isAlreadyContact);
                } catch (err) {
                    console.error('Failed to check contact status:', err);
                }
            }
        };
        checkContactStatus();
    }, [profile, currentUserId]);

    const handleAddContact = async () => {
        if (!profile || !currentUserId) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await addContact(profile.id);
            setIsContact(true);
            setSuccess('Контакт успешно добавлен!');
        } catch (err: any) {
            setError(err.message || 'Не удалось добавить контакт');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !profile) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={onClose}
        >
            <div
                className="bg-gray-800 rounded-lg p-6 w-80 max-w-sm shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white text-lg font-medium">Профиль пользователя</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"
                    >
                        <FiX size={20} />
                    </button>
                </div>
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-medium text-2xl">
                            {profile.username.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="text-center">
                        <p className="text-white font-semibold text-lg">{profile.username}</p>
                        <p className="text-gray-400 text-sm">{profile.status === 'online' ? 'В сети' : 'Не в сети'}</p>
                    </div>
                    <div className="w-full space-y-2">
                        <div className="flex items-center text-gray-400 text-sm">
                            <FiCalendar className="mr-2" />
                            <span>Присоединился к группе</span>
                        </div>
                        <p className="text-white text-sm">
                            {new Date(joinedAt).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                    {profile.bio && (
                        <div className="w-full space-y-2">
                            <div className="flex items-center text-gray-400 text-sm">
                                <FiUsers className="mr-2" />
                                <span>Биография</span>
                            </div>
                            <p className="text-white text-sm">{profile.bio}</p>
                        </div>
                    )}
                </div>
                {error && (
                    <p className="text-red-400 text-sm text-center mt-4">{error}</p>
                )}
                {success && (
                    <p className="text-green-400 text-sm text-center mt-4">{success}</p>
                )}
                <div className="flex flex-col space-y-2 mt-6">
                    {currentUserId !== profile.id && !isContact && (
                        <button
                            onClick={handleAddContact}
                            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Добавление...' : 'Добавить в контакты'}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};

const RightSidebar: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    chatName: string;
    onDeleteChat: () => void;
    groupId: string;
    onMemberClick: (userId: string, joinedAt: string) => void;
}> = ({ isOpen, onClose, chatName, onDeleteChat, groupId, onMemberClick }) => {
    const [members, setMembers] = React.useState<GroupMember[]>([]);
    const [userProfiles, setUserProfiles] = React.useState<Record<string, UserProfile>>({});
    const [loading, setLoading] = React.useState(false);
    const [userLoading, setUserLoading] = React.useState<Record<string, boolean>>({});

    React.useEffect(() => {
        const fetchMembers = async () => {
            if (isOpen && groupId) {
                setLoading(true);
                try {
                    const fetchedMembers = await getMembers(groupId);
                    setMembers(fetchedMembers);

                    const userIdSet = new Set(fetchedMembers.map(member => member.userId));
                    const profiles: Record<string, UserProfile> = { ...userProfiles };
                    const loadingStates: Record<string, boolean> = { ...userLoading};

                    await Promise.all(
                        Array.from(userIdSet).map(async (userId) => {
                            if (!profiles[userId]) {
                                loadingStates[userId] = true;
                                setUserLoading({ ...loadingStates });
                                try {
                                    const profile = await getProfile(userId);
                                    profiles[userId] = profile;
                                } catch (error) {
                                    console.error(`Failed to fetch profile for user ${userId}:`, error);
                                    profiles[userId] = {
                                        id: userId,
                                        username: `User ${userId.slice(0, 6)}`,
                                        name: '',
                                        status: 'offline',
                                        bio: '',
                                        avatar: '',
                                        profileLink: '',
                                        createdAt: new Date().toISOString(),
                                        updatedAt: new Date().toISOString(),
                                    };
                                } finally {
                                    loadingStates[userId] = false;
                                    setUserLoading({ ...loadingStates });
                                }
                            }
                        })
                    );
                    setUserProfiles(profiles);
                } catch (error) {
                    console.error('Failed to fetch members:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchMembers();
    }, [isOpen, groupId]);

    const handleDelete = () => {
        if (window.confirm(`Вы уверены, что хотите удалить группу "${chatName}"? Это действие нельзя отменить.`)) {
            onDeleteChat();
            onClose();
        }
    };

    return (
        <div
            className={`fixed top-0 right-0 h-screen w-80 bg-gray-800 border-l border-gray-900 z-30 transition-transform duration-300 ease-in-out ${
                isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'
            }`}
        >
            <div className="flex items-center justify-between h-20 p-4 bg-gray-800">
                <h2 className="text-white font-medium text-lg flex items-center">
                    <span className="bg-gradient-to-br from-blue-500 to-blue-700 text-transparent bg-clip-text w-6 h-6 rounded-full flex items-center justify-center mr-2">
                        i
                    </span>
                    Информация о группе
                </h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
                >
                    <FiX size={20} />
                </button>
            </div>

            <div className="p-4 space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center text-gray-400 text-sm">
                        <FiUsers className="mr-2" />
                        <span>Название группы</span>
                    </div>
                    <p className="text-white font-medium">{chatName}</p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center text-gray-400 text-sm">
                        <FiUsers className="mr-2" />
                        <span>Участники</span>
                    </div>
                    {loading ? (
                        <p className="text-gray-400">Загрузка...</p>
                    ) : members.length === 0 ? (
                        <p className="text-gray-400">Нет участников</p>
                    ) : (
                        <div className="space-y-3">
                            {members.map((member) => {
                                const profile = userProfiles[member.userId] || {
                                    id: member.userId,
                                    username: `User ${member.userId.slice(0, 6)}`,
                                    name: '',
                                    status: 'offline',
                                    bio: '',
                                    avatar: '',
                                    profileLink: '',
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString(),
                                };
                                const isLoading = userLoading[member.userId] || false;

                                return (
                                    <div
                                        key={member._id}
                                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                                        onClick={() => onMemberClick(member.userId, member.joinedAt)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                                <span className="text-white font-medium text-lg">
                                                    {profile.username.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-white font-semibold">
                                                    {isLoading ? 'Загрузка...' : profile.username}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    Присоединился: {new Date(member.joinedAt).toLocaleDateString('ru-RU')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center text-gray-400 text-sm">
                        <FiCalendar className="mr-2" />
                        <span>Дата создания</span>
                    </div>
                    <p className="text-white">
                        {new Date().toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                </div>

                <button
                    onClick={handleDelete}
                    className="w-full flex items-center justify-center py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 mt-6"
                >
                    <FiTrash2 className="mr-2" />
                    Удалить группу
                </button>
            </div>
        </div>
    );
};

const ChatArea: React.FC<ChatAreaProps> = ({ selectedChatId, chatName = 'Чат', onChatDeleted }) => {
    const [message, setMessage] = React.useState('');
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
    const [isSending, setIsSending] = React.useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
    const [selectedProfile, setSelectedProfile] = React.useState<UserProfile | null>(null);
    const [selectedJoinedAt, setSelectedJoinedAt] = React.useState<string>('');
    const chatAreaRef = React.useRef<HTMLDivElement>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const [userProfiles, setUserProfiles] = React.useState<Record<string, UserProfile>>({});

    const reloadMessages = React.useCallback(async () => {
        if (selectedChatId && currentUserId) {
            try {
                const fetchedMessages = await getMessages(selectedChatId);
                console.log('Fetched messages:', fetchedMessages);
                setMessages(mapMessages(fetchedMessages, currentUserId));
                setError(null);
            } catch (err) {
                setError('Не удалось загрузить сообщения');
                console.error('Error loading messages:', err);
            }
        }
    }, [selectedChatId, currentUserId]);

    React.useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await axiosInstance.get('/users/me');
                setCurrentUserId(response.data._id);
            } catch (error) {
                console.error('Ошибка при получении текущего пользователя:', error);
                setError('Не удалось загрузить данные пользователя');
            }
        };

        fetchCurrentUser().catch(error => {
            console.error('Error in fetchCurrentUser:', error);
        });
    }, []);

    React.useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
                console.log('Component width:', entry.contentRect.width);
            });
        });

        if (chatAreaRef.current) {
            resizeObserver.observe(chatAreaRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    React.useEffect(() => {
        reloadMessages().catch(error => {
            console.error('Error in reloadMessages:', error);
        });
    }, [reloadMessages]);

    const scrollToBottom = React.useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    React.useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSend = async () => {
        if (!message.trim() && !isSending) return;

        setIsSending(true);
        const tempId = `temp-${Date.now()}`;

        try {
            const tempMessage: Message = {
                id: tempId,
                text: message.trim(),
                sender: 'me',
                timestamp: new Date(),
                status: 'sent',
                isEditable: true,
            };

            setMessages(prev => [...prev, tempMessage]);
            setMessage('');

            await sendMessage(selectedChatId!, message.trim());
            await reloadMessages();
            setError(null);
        } catch (error) {
            console.error('Ошибка при отправке сообщения:', error);
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            setError('Не удалось отправить сообщение');
        } finally {
            setIsSending(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        if (!selectedChatId || isSending) return;

        setIsSending(true);
        const tempId = `temp-${Date.now()}`;

        try {
            const uploadResponse = await uploadFile(file);
            const fileId = uploadResponse.UUID_FILE;
            const tempMessage: Message = {
                id: tempId,
                text: fileId,
                sender: 'me',
                timestamp: new Date(),
                status: 'sent',
                isEditable: false,
                file: {
                    id: fileId,
                    name: file.name,
                    size: file.size,
                    type: file.type.split('/')[1] || 'unknown',
                    url: getFileDownloadUrl(fileId),
                },
            };

            setMessages(prev => [...prev, tempMessage]);

            await sendMessage(selectedChatId, fileId, { type: 'file', name: file.name, size: file.size, type: file.type });
            await reloadMessages();
            setError(null);
        } catch (error) {
            console.error('Ошибка при загрузке файла:', error);
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            setError('Не удалось загрузить файл');
        } finally {
            setIsSending(false);
        }
    };

    const handleVoiceMessage = async (audioBlob: Blob) => {
        if (!selectedChatId || isSending) return;

        setIsSending(true);
        const tempId = `temp-${Date.now()}`;
        const file = new File([audioBlob], `voice_message_${Date.now()}.mp3`, { type: 'audio/mp3' });

        try {
            const uploadResponse = await uploadFile(file);
            const fileId = uploadResponse.UUID_FILE;
            const tempMessage: Message = {
                id: tempId,
                text: fileId,
                sender: 'me',
                timestamp: new Date(),
                status: 'sent',
                isEditable: false,
                file: {
                    id: fileId,
                    name: file.name,
                    size: file.size,
                    type: 'audio/mp3',
                    url: getFileDownloadUrl(fileId),
                },
            };

            setMessages(prev => [...prev, tempMessage]);

            await sendMessage(selectedChatId, fileId, { type: 'audio', name: file.name, size: file.size, type: 'audio/mp3' });
            await reloadMessages();
            setError(null);
        } catch (error) {
            console.error('Ошибка при отправке голосового сообщения:', error);
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            setError('Не удалось отправить голосовое сообщение');
        } finally {
            setIsSending(false);
        }
    };

    const handleEdit = async (messageId: string, newText: string) => {
        if (!newText.trim()) return;

        try {
            await updateMessage(messageId, newText);
            await reloadMessages();
            setError(null);
        } catch (error) {
            console.error('Ошибка при обновлении сообщения:', error);
            setError('Не удалось обновить сообщение');
        }
    };

    const handleDelete = async (messageId: string) => {
        try {
            await deleteMessage(messageId);
            await reloadMessages();
            setError(null);
        } catch (error) {
            console.error('Ошибка при удалении сообщения:', error);
            setError('Не удалось удалить сообщение');
        }
    };

    const handleDeleteChat = async () => {
        if (!selectedChatId) return;

        try {
            await deleteChat(selectedChatId);
            onChatDeleted?.(selectedChatId);
            setIsSidebarOpen(false);
            setError(null);
            setMessages([]);
            setMessage('');
        } catch (error) {
            console.error('Ошибка при удалении группы:', error);
            setError('Не удалось удалить группу');
        }
    };

    const handleMenuClick = () => {
        setIsSidebarOpen(true);
    };

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
    };

    const handleMemberClick = (userId: string, joinedAt: string) => {
        const profile = userProfiles[userId];
        setSelectedProfile(profile);
        setSelectedJoinedAt(joinedAt);
        setIsProfileModalOpen(true);
    };

    const handleCloseProfileModal = () => {
        setIsProfileModalOpen(false);
        setSelectedProfile(null);
        setSelectedJoinedAt('');
    };

    React.useEffect(() => {
        const fetchMembers = async () => {
            if (selectedChatId) {
                try {
                    const fetchedMembers = await getMembers(selectedChatId);
                    const profiles: Record<string, UserProfile> = { ...userProfiles };
                    await Promise.all(
                        fetchedMembers.map(async (member: GroupMember) => {
                            if (!profiles[member.userId]) {
                                try {
                                    const profile = await getProfile(member.userId);
                                    profiles[member.userId] = profile;
                                } catch (error) {
                                    console.error(`Failed to fetch profile for user ${member.userId}:`, error);
                                    profiles[member.userId] = {
                                        id: member.userId,
                                        username: `User ${member.userId.slice(0, 6)}`,
                                        name: '',
                                        status: 'offline',
                                        bio: '',
                                        avatar: '',
                                        profileLink: '',
                                        createdAt: new Date().toISOString(),
                                        updatedAt: new Date().toISOString(),
                                    };
                                }
                            }
                        })
                    );
                    setUserProfiles(profiles);
                } catch (error) {
                    console.error('Failed to fetch members:', error);
                }
            }
        };

        fetchMembers();
    }, [selectedChatId]);

    if (!selectedChatId) {
        return (
            <div className="flex-1 flex flex-col items-center h-screen justify-center bg-[#0e1621] text-gray-400 p-4">
                <div className="text-center max-w-md">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h2 className="text-xl font-medium mb-2">Чат не выбран</h2>
                    <p>Выберите чат из списка или начните новый диалог</p>
                </div>
            </div>
        );
    }

    const messageGroups = groupMessagesByDate(messages);

    return (
        <div className="flex h-screen bg-[#0e1621] relative" ref={chatAreaRef}>
            <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'mr-80' : 'mr-0'}`}>
                <ChatHeader chatName={chatName} onMenuClick={handleMenuClick} />
                {error && (
                    <div className="p-2 bg-red-600 text-white text-center text-sm">
                        {error}
                    </div>
                )}
                <div className="flex-1 overflow-y-auto p-4">
                    {messageGroups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <svg className="w-16 h-16 mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <h3 className="text-lg font-medium mb-1">Нет сообщений</h3>
                            <p className="text-sm">Начните диалог с {chatName}</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {messageGroups.map((group) => (
                                <React.Fragment key={group.date}>
                                    <DateDivider date={group.date} />
                                    {group.messages.map((msg) => (
                                        <MessageBubble
                                            key={msg.id}
                                            message={msg}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            isOwnMessage={msg.sender === 'me' && msg.isEditable === true}
                                        />
                                    ))}
                                </React.Fragment>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
                <MessageInput
                    value={message}
                    onChange={setMessage}
                    onSend={handleSend}
                    isSending={isSending}
                    onFileUpload={handleFileUpload}
                    onVoiceMessage={handleVoiceMessage}
                />
            </div>

            <RightSidebar
                isOpen={isSidebarOpen}
                onClose={handleCloseSidebar}
                chatName={chatName}
                onDeleteChat={handleDeleteChat}
                groupId={selectedChatId}
                onMemberClick={handleMemberClick}
            />

            <UserProfileModal
                isOpen={isProfileModalOpen}
                onClose={handleCloseProfileModal}
                profile={selectedProfile}
                joinedAt={selectedJoinedAt}
            />
        </div>
    );
};

export default ChatArea;