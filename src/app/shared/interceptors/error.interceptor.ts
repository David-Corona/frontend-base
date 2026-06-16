import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import type { ApiError } from '@shared/models/api.models';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const messageService = inject(MessageService);

    return next(req).pipe(
        catchError((error: unknown) => {
            if (error instanceof HttpErrorResponse) {
                const apiError = normalizeError(error);

                // Show toast for 5xx errors (skip logout to avoid confusing UX)
                if (error.status >= 500 && !req.url.includes('/api/auth/logout')) {
                    messageService.add({
                        severity: 'error',
                        summary: 'Server Error',
                        detail: apiError.message || 'An unexpected error occurred. Please try again later.'
                    });
                }

                return throwError(() => apiError);
            }

            return throwError(() => error);
        })
    );
};

function normalizeError(error: HttpErrorResponse): ApiError {
    if (error.error && typeof error.error === 'object' && 'statusCode' in error.error) {
        return error.error as ApiError;
    }

    const statusCode = error.status;
    const isNetworkError = statusCode === 0;

    return {
        statusCode,
        error: error.statusText || 'Error',
        message: isNetworkError
            ? 'Unable to connect to the server. Please check your internet connection and try again.'
            : (error.statusText || 'An unexpected error occurred'),
        code: isNetworkError ? 'NETWORK_ERROR' : 'HTTP_EXCEPTION'
    };
}
