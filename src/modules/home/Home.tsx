import * as React from 'react';
import Sidebar from './sidebar/Sidebar';
import ChatArea from './chatarea/ChatArea';
import { sendMessage } from './sidebar/usersearch/api/api'; // Исправлен путь импорта

const Home: React.FC = () => {
    const [selectedChatId, setSelectedChatId] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState<string>('');

    const handleSendMessage = async (message: string) => {
        if (selectedChatId) {
            try {
                await sendMessage(selectedChatId, message);
                console.log(`Message "${message}" sent to chat ${selectedChatId}`);
            } catch (error) {
                console.error('Failed to send message:', error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#0e1621] flex">
            {/* Sidebar */}
            <div className="w-1/4">
                <Sidebar
                    onSelectChat={setSelectedChatId}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            </div>
            {/* Chat Area */}
            <div className="w-3/4">
                <ChatArea selectedChatId={selectedChatId} onSendMessage={handleSendMessage} />
            </div>
        </div>
    );
};

export default Home;