export interface UserProfile {
    id: string;
    name: string;
    username: string;
    displayName: string;
    email: string;
    avatar: string;
    status: string;
    bio: string;
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