import type { User } from '@shared/models/user.models';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    user: User;
}

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface VerifyEmailRequest {
    token: string;
}

export interface ResendVerificationRequest {
    email: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

export interface RefreshResponse {
    accessToken: string;
    user: User;
}

export type { User } from '@shared/models/user.models';
