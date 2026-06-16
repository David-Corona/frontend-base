export interface Role {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
    createdAt: string;
    updatedAt: string;
}
