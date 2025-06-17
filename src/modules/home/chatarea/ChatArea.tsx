import * as React from 'react';
import { getMessages, sendMessage } from '../sidebar/usersearch/api/api';
import axiosInstance from '../sidebar/usersearch/api/axiosInstance';

interface Message {
    id: string;
    text: string;
    sender: 'me' | 'them';
    timestamp: Date;
    status?: 'sent' | 'delivered' | 'read';
}

interface ChatAreaProps {
    selectedChatId: string | null;
    chatName?: string;
    onSendMessage: (message: string) => void;
}

const ChatHeader: React.FC<{ chatName: string }> = ({ chatName }) => {
    return (
        <div className="flex items-center justify-between px-4 h-15 bg-[#1e2a38]">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-medium">{chatName.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                    <h2 className="text-white font-medium">{chatName}</h2>
                    <p className="text-xs text-gray-400">online</p>
                </div>
            </div>
            <button className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                </svg>
            </button>
        </div>
    );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    return (
        <div className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'} mb-3`}>
            <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'me'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-[#242f3d] text-white rounded-tl-none'
                }`}
            >
                <div className="text-sm">{message.text}</div>
                <div className="text-right mt-1">
                    <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {message.sender === 'me' && (
                            <span className="ml-1">
                                {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓' : ''}
                            </span>
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
};

const MessageInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
}> = ({ value, onChange, onSend }) => {
    return (
        <div className="flex items-center mt-auto p-3 bg-[#1e2a38] border-t border-gray-700">
            <button className="text-gray-400 hover:text-white p-2 mx-1 rounded-full hover:bg-white/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
            </button>
            <button className="text-gray-400 hover:text-white p-2 mx-1 rounded-full hover:bg-white/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
            </button>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 px-4 py-2 mx-2 bg-[#242f3d] text-white rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 border border-[#2b5278] placeholder-gray-500"
                placeholder="Write a message..."
                onKeyDown={(e) => e.key === 'Enter' && onSend()}
            />
            <button
                onClick={onSend}
                disabled={!value.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-full"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
            </button>
        </div>
    );
};

const ChatArea: React.FC<ChatAreaProps> = ({ selectedChatId, chatName = 'Chat', onSendMessage }) => {
    const [message, setMessage] = React.useState('');
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

    // Получаем ID текущего пользователя
    React.useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await axiosInstance.get('/users/me');
                setCurrentUserId(response.data._id);
            } catch (error) {
                console.error('Failed to fetch current user:', error);
            }
        };
        fetchCurrentUser();
    }, []);

    // Загружаем сообщения при изменении выбранного чата или ID пользовател
    React.useEffect(() => {
        if (selectedChatId && currentUserId) {
            (async () => {
                try {
                    const fetchedMessages = await getMessages(selectedChatId);
                    const mappedMessages = fetchedMessages.map((msg: any): Message => ({
                        id: msg._id,
                        text: msg.payload?.payload || 'No message content',
                        sender: msg.senderId === currentUserId ? 'me' : 'them',
                        timestamp: new Date(msg.createdAt),
                        status: msg.senderId === currentUserId ? 'delivered' : undefined,
                    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

                    setMessages(mappedMessages);
                } catch (error) {
                    console.error('Failed to load messages:', error);
                }
            })();
        } else {
            setMessages([]);
        }
    }, [selectedChatId, currentUserId]);

    const handleSend = async () => {
        if (message.trim() && selectedChatId) {
            try {
                await sendMessage(selectedChatId, message);
                const newMessage: Message = {
                    id: `temp-${Date.now()}`,
                    text: message,
                    sender: 'me',
                    timestamp: new Date(),
                    status: 'sent',
                };
                setMessages(prev => [...prev, newMessage]);
                onSendMessage(message);
                setMessage('');
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    if (!selectedChatId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-screen text-gray-400 p-4">
                <div className="text-center max-w-md">
                    <h2 className="text-xl font-medium mb-2">No chat selected</h2>
                    <p>Choose a chat from the list or start a new conversation</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 h-screen flex flex-col bg-[#17212b]">
            <ChatHeader chatName={chatName} />
            <div className="flex-1 overflow-y-auto p-4 bg-[#0e1621]">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                            <p>This is the beginning of your conversation with {chatName}</p>
                            <p className="text-sm mt-1">Send your first message!</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}
                    </div>
                )}
            </div>
            <MessageInput value={message} onChange={setMessage} onSend={handleSend} />
        </div>
    );
};

export default ChatArea;