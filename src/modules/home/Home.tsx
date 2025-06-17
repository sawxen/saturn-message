import * as React from 'react';
import Sidebar from './sidebar/Sidebar';
import ChatArea from './chatarea/ChatArea';

const Home: React.FC = () => {
    const [selectedChatId, setSelectedChatId] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState<string>('');

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
                <ChatArea selectedChatId={selectedChatId} />
            </div>
        </div>
    );
};

export default Home;