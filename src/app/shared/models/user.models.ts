export interface User {
    id: string;
    email: string;
    name: string | null;
    isActive: boolean;
    isVerified: boolean;
    role: {
        id: string;
        name: string;
    };
    permissions: string[];
    createdAt: string;
    updatedAt: string;
}

export interface UsersQuery {
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive' | 'all';
    name?: string;
    email?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}
