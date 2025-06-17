import * as React from 'react';
import type { UserProfile } from '../api/types';

interface ProfileButtonProps {
    onOpenModal: () => void;
    profile: UserProfile | null;
    className?: string;
}

const ProfileButton: React.FC<ProfileButtonProps> = ({
                                                         onOpenModal,
                                                         profile,
                                                         className = ''
                                                     }) => {
    const displayName = profile?.name || 'New User';
    const username = profile?.username ? `@${profile.username}` : '@username';
    const avatar = profile?.avatar;
    const status = profile?.status;

    return (
        <div className={`px-4 mb-4 ${className}`}>
            <button
                onClick={onOpenModal}
                className="w-full group flex items-center p-2 rounded-lg transition-all
                bg-gray-800/50 hover:bg-gray-700/70 border border-gray-700 hover:border-gray-600
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                aria-label="Open profile"
            >
                <div className="relative mr-3 shrink-0">
                    {avatar ? (
                        <img
                            src={avatar}
                            alt={`${displayName}'s avatar`}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-600 group-hover:border-blue-400 transition-colors"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/default-avatar.png';
                            }}
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600 group-hover:border-blue-400 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    )}
                    {status === 'online' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 bg-green-500"></div>
                    )}
                </div>

                <div className="text-left overflow-hidden flex-1 min-w-0">
                    <p className="text-white font-medium truncate" title={displayName}>
                        {displayName}
                    </p>
                    <p className="text-xs text-gray-400 truncate" title={username}>
                        {username}
                    </p>
                </div>

                <div className="ml-2 text-gray-400 group-hover:text-blue-400 transition-colors shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
            </button>
        </div>
    );
};

export default ProfileButton;