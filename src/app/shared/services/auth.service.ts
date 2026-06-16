import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '@/environments/environment';
import type { User, LoginRequest, LoginResponse, RegisterRequest, VerifyEmailRequest, ResendVerificationRequest, ForgotPasswordRequest, ResetPasswordRequest, RefreshResponse } from '@shared/models/auth.models';
import type { ChangePasswordRequest } from '@shared/models/user.models';

function isTokenExpired(token: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 3) {
        return false;
    }
    try {
        const payload = JSON.parse(atob(parts[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

const AUTH_API = `${environment.apiUrl}/api/auth`;
const ACCESS_TOKEN_KEY = 'access_token';
const USER_KEY = 'user';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);

    private readonly _currentUser = signal<User | null>(null);
    private readonly _isAuthenticated = signal<boolean>(false);
    private readonly _isLoading = signal<boolean>(false);

    readonly currentUser = this._currentUser.asReadonly();
    readonly isAuthenticated = this._isAuthenticated.asReadonly();
    readonly isLoading = this._isLoading.asReadonly();

    hasPermission(permission: string): boolean {
        const user = this._currentUser();
        return user?.permissions?.includes(permission) ?? false;
    }

    hasAnyPermission(...permissions: string[]): boolean {
        const user = this._currentUser();
        if (!user?.permissions) return false;
        return permissions.some((p) => user.permissions.includes(p));
    }

    initializeAuth(): Observable<void> {
        const token = this.getAccessToken();
        const userJson = localStorage.getItem(USER_KEY);
        if (token && userJson) {
            try {
                const user = JSON.parse(userJson) as User;
                if (isTokenExpired(token)) {
                    return this.refreshToken().pipe(
                        map((response) => {
                            this._currentUser.set(response.user);
                            this._isAuthenticated.set(true);
                        }),
                        catchError(() => {
                            this.clearAuth();
                            return of(void 0);
                        })
                    );
                }
                this._currentUser.set(user);
                this._isAuthenticated.set(true);
            } catch {
                this.clearAuth();
            }
        }
        return of(void 0);
    }

    login(request: LoginRequest): Observable<LoginResponse> {
        this._isLoading.set(true);
        return this.http.post<LoginResponse>(`${AUTH_API}/login`, request).pipe(
            map((response) => {
                this.setAccessToken(response.accessToken);
                this.setUser(response.user);
                this._currentUser.set(response.user);
                this._isAuthenticated.set(true);
                this._isLoading.set(false);
                return response;
            }),
            catchError((error) => {
                this._isLoading.set(false);
                return throwError(() => error);
            })
        );
    }

    refreshToken(): Observable<RefreshResponse> {
        return this.http.post<RefreshResponse>(`${AUTH_API}/refresh`, {}, { withCredentials: true }).pipe(
            map((response) => {
                this.setAccessToken(response.accessToken);
                this.setUser(response.user);
                this._currentUser.set(response.user);
                this._isAuthenticated.set(true);
                return response;
            })
        );
    }

    logout(): Observable<void> {
        return this.http.post<void>(`${AUTH_API}/logout`, {}, { withCredentials: true }).pipe(
            catchError(() => of(void 0)),
            map(() => {
                this.clearAuth();
            })
        );
    }

    changePassword(data: ChangePasswordRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${AUTH_API}/change-password`, data).pipe(
            map((response) => {
                this.setAccessToken(response.accessToken);
                this.setUser(response.user);
                this._currentUser.set(response.user);
                this._isAuthenticated.set(true);
                return response;
            })
        );
    }

    updateUserInStorage(user: User): void {
        this.setUser(user);
        this._currentUser.set(user);
    }

    private postMessage(endpoint: string, body: unknown): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${AUTH_API}/${endpoint}`, body);
    }

    register(request: RegisterRequest): Observable<{ message: string }> {
        return this.postMessage('register', request);
    }

    verifyEmail(request: VerifyEmailRequest): Observable<{ message: string }> {
        return this.postMessage('verify-email', request);
    }

    resendVerification(request: ResendVerificationRequest): Observable<{ message: string }> {
        return this.postMessage('resend-verification', request);
    }

    forgotPassword(request: ForgotPasswordRequest): Observable<{ message: string }> {
        return this.postMessage('forgot-password', request);
    }

    resetPassword(request: ResetPasswordRequest): Observable<{ message: string }> {
        return this.postMessage('reset-password', request);
    }

    getAccessToken(): string | null {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }

    private setAccessToken(token: string): void {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }

    private setUser(user: User): void {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    clearAuth(): void {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        this._currentUser.set(null);
        this._isAuthenticated.set(false);
    }

    navigateToLogin(returnUrl?: string): void {
        const queryParams = returnUrl ? { returnUrl } : {};
        void this.router.navigate(['/auth/login'], { queryParams });
    }
}
