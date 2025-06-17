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
    onSendMessage?: (message: string) => Promise<void>;
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
    isSending: boolean;
}> = ({ value, onChange, onSend, isSending }) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !isSending) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div className="flex items-center mt-auto p-3 bg-[#1e2a38] border-t border-gray-700">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 px-4 py-2 mx-2 bg-[#242f3d] text-white rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 border border-[#2b5278] placeholder-gray-500"
                placeholder="Write a message..."
                onKeyDown={handleKeyDown}
                disabled={isSending}
            />
            <button
                onClick={onSend}
                disabled={!value.trim() || isSending}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-full"
            >
                {isSending ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                )}
            </button>
        </div>
    );
};

const ChatArea: React.FC<ChatAreaProps> = ({ selectedChatId, chatName = 'Chat', onSendMessage }) => {
    const [message, setMessage] = React.useState('');
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
    const [isSending, setIsSending] = React.useState(false);
    const sendLockRef = React.useRef(false);

    // Get current user ID
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

    // Load messages
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

    const handleSend = React.useCallback(async () => {
        if (sendLockRef.current || !message.trim() || !selectedChatId) return;

        sendLockRef.current = true;
        setIsSending(true);
        const messageText = message.trim();
        const tempId = `temp-${Date.now()}`;

        try {
            // Optimistic UI update
            const tempMessage: Message = {
                id: tempId,
                text: messageText,
                sender: 'me',
                timestamp: new Date(),
                status: 'sent',
            };

            setMessages(prev => [...prev, tempMessage]);
            setMessage('');

            // Call optional callback if provided
            if (onSendMessage) {
                await onSendMessage(messageText);
            }

            // Send to server
            await sendMessage(selectedChatId, messageText);

            // Update message status
            setMessages(prev => prev.map(msg =>
                msg.id === tempId ? {...msg, status: 'delivered'} : msg
            ));
        } catch (error) {
            console.error('Error sending message:', error);
            // Rollback on error
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            setMessage(messageText);
        } finally {
            setIsSending(false);
            sendLockRef.current = false;
        }
    }, [message, selectedChatId, onSendMessage]);

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
            <MessageInput
                value={message}
                onChange={setMessage}
                onSend={handleSend}
                isSending={isSending}
            />
        </div>
    );
};

export default ChatArea;