export interface Session {
    id: string;
    isCurrent: boolean;
    userAgent: string | null;
    ip: string | null;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}
