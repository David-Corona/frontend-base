import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '@shared/services/auth.service';

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

function processQueue(error: unknown | null, token: string | null): void {
    for (const item of refreshQueue) {
        if (error) {
            item.reject(error);
        } else if (token) {
            item.resolve(token);
        }
    }
    refreshQueue = [];
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const authService = inject(AuthService);

    // Skip auth header for public auth endpoints
    if (isPublicAuthEndpoint(req.url)) {
        return next(req);
    }

    const token = authService.getAccessToken();
    if (token) {
        req = addToken(req, token);
    }

    return next(req).pipe(
        catchError((error) => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
                if (req.headers.has('X-Retry')) {
                    authService.clearAuth();
                    authService.navigateToLogin();
                    return throwError(() => error);
                }
                return handle401(req, next, authService);
            }
            return throwError(() => error);
        })
    ) as Observable<HttpEvent<unknown>>;
};

function isPublicAuthEndpoint(url: string): boolean {
    const authEndpoints = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/refresh',
        '/api/auth/logout',
        '/api/auth/verify-email',
        '/api/auth/resend-verification',
        '/api/auth/forgot-password',
        '/api/auth/reset-password',
    ];
    try {
        const path = new URL(url, 'http://localhost').pathname;
        return authEndpoints.includes(path);
    } catch {
        return false;
    }
}

function addToken(req: HttpRequest<unknown>, token: string, isRetry?: boolean): HttpRequest<unknown> {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (isRetry) {
        headers['X-Retry'] = 'true';
    }
    return req.clone({ setHeaders: headers });
}

function handle401(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<unknown>> {
    if (!isRefreshing) {
        isRefreshing = true;
        return authService.refreshToken().pipe(
            switchMap((response) => {
                isRefreshing = false;
                processQueue(null, response.accessToken);
                return next(addToken(req, response.accessToken, true));
            }),
            catchError((refreshError) => {
                isRefreshing = false;
                processQueue(refreshError, null);
                authService.clearAuth();
                authService.navigateToLogin();
                return throwError(() => refreshError);
            })
        ) as Observable<HttpEvent<unknown>>;
    }

    // Queue the request while refresh is in progress
    return new Observable<HttpEvent<unknown>>((observer) => {
        const queueItem = {
            resolve: (newToken: string) => {
                next(addToken(req, newToken, true)).subscribe({
                    next: (res) => observer.next(res as HttpEvent<unknown>),
                    error: (err) => observer.error(err),
                    complete: () => observer.complete()
                });
            },
            reject: (err: unknown) => {
                observer.error(err);
            }
        };
        refreshQueue.push(queueItem);
    });
}
