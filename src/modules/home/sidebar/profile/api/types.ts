export interface UserProfile {
    id: string;
    name: string;
    username: string;
    status: string;
    bio: string;
    avatar: string;
    profileLink: string;
    birthDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface EditUserDto {
    displayName: string;
    username: string;
    bio?: string;
    avatar?: string;
    profileLink?: string;
    birthDate?: string;
}