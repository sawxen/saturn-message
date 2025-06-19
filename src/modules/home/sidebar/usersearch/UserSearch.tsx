import * as React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

interface UserSearchProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ searchQuery, setSearchQuery }) => {
    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
            </div>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-gray-700 rounded-full text-white focus:outline-none placeholder-gray-400"
                placeholder="Поиск..."
            />
            {searchQuery && (
                <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                >
                    <FiX />
                </button>
            )}
        </div>
    );
};

export default UserSearch;