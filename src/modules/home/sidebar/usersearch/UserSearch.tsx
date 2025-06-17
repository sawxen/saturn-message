import * as React from 'react';

interface UserSearchProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isLoading?: boolean;
}

const UserSearch: React.FC<UserSearchProps> = ({
                                                   searchQuery,
                                                   setSearchQuery,
                                                   isLoading = false
                                               }) => {
    return (
        <div className="px-4 py-3 border-b border-gray-700">
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#242f3d] text-white rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     border border-gray-700 placeholder-gray-500 transition-all"
                    placeholder="Search users or chats..."
                    disabled={isLoading}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    )}
                </div>
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default UserSearch;