export interface ApiError {
    statusCode: number;
    error: string;
    message: string;
    code: string;
}

export interface MessageResponse {
    message: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
