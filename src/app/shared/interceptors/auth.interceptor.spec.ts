import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '@shared/services/auth.service';
import { authInterceptor } from './auth.interceptor';
import { Router } from '@angular/router';

describe('authInterceptor', () => {
    let httpClient: HttpClient;
    let httpMock: HttpTestingController;
    let authService: AuthService;
    let routerMock: { navigate: jest.Mock };

    beforeEach(() => {
        routerMock = { navigate: jest.fn() };
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
                AuthService,
                { provide: Router, useValue: routerMock }
            ]
        });

        httpClient = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
        authService = TestBed.inject(AuthService);
        localStorage.clear();
    });

    afterEach(() => {
        httpMock.verify();
        localStorage.clear();
    });

    it('should attach token to non-auth requests', () => {
        localStorage.setItem('access_token', 'test-token');

        httpClient.get('/api/protected').subscribe();

        const req = httpMock.expectOne('/api/protected');
        expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
        req.flush({});
    });

    it('should skip auth header for public auth endpoints', () => {
        localStorage.setItem('access_token', 'test-token');

        httpClient.post('http://localhost:3000/api/auth/login', {}).subscribe();

        const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
        expect(req.request.headers.has('Authorization')).toBe(false);
        req.flush({});
    });

    it('should handle 401 by refreshing token and retrying', () => {
        localStorage.setItem('access_token', 'old-token');

        httpClient.get('/api/protected').subscribe((response) => {
            expect(response).toEqual({ data: 'success' });
        });

        // First request fails with 401
        const firstReq = httpMock.expectOne('/api/protected');
        expect(firstReq.request.headers.get('Authorization')).toBe('Bearer old-token');
        firstReq.flush({}, { status: 401, statusText: 'Unauthorized' });

        // Refresh request
        const refreshReq = httpMock.expectOne('http://localhost:3000/api/auth/refresh');
        expect(refreshReq.request.method).toBe('POST');
        expect(refreshReq.request.withCredentials).toBe(true);
        refreshReq.flush({ accessToken: 'new-token' });

        // Retried request with new token
        const retryReq = httpMock.expectOne('/api/protected');
        expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
        retryReq.flush({ data: 'success' });

        expect(localStorage.getItem('access_token')).toBe('new-token');
    });

    it('should clear auth and redirect on refresh failure', () => {
        localStorage.setItem('access_token', 'old-token');
        jest.spyOn(authService, 'clearAuth').mockImplementation(() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
        });
        jest.spyOn(authService, 'navigateToLogin').mockImplementation(() => {});

        httpClient.get('/api/protected').subscribe({
            error: (error: HttpErrorResponse) => {
                expect(error.status).toBe(401);
            }
        });

        // First request fails with 401
        const firstReq = httpMock.expectOne('/api/protected');
        firstReq.flush({}, { status: 401, statusText: 'Unauthorized' });

        // Refresh request fails
        const refreshReq = httpMock.expectOne('http://localhost:3000/api/auth/refresh');
        refreshReq.flush({}, { status: 401, statusText: 'Unauthorized' });

        expect(authService.clearAuth).toHaveBeenCalled();
        expect(authService.navigateToLogin).toHaveBeenCalled();
    });

    it('should not retry refresh if retried request also returns 401', () => {
        localStorage.setItem('access_token', 'old-token');
        jest.spyOn(authService, 'clearAuth').mockImplementation(() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
        });
        jest.spyOn(authService, 'navigateToLogin').mockImplementation(() => {});

        httpClient.get('/api/protected').subscribe({
            error: (error: HttpErrorResponse) => {
                expect(error.status).toBe(401);
            }
        });

        // First request fails with 401
        const firstReq = httpMock.expectOne('/api/protected');
        firstReq.flush({}, { status: 401, statusText: 'Unauthorized' });

        // Refresh succeeds
        const refreshReq = httpMock.expectOne('http://localhost:3000/api/auth/refresh');
        refreshReq.flush({ accessToken: 'new-token' });

        // Retried request also fails with 401 — should NOT trigger another refresh
        const retryReq = httpMock.expectOne('/api/protected');
        expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
        expect(retryReq.request.headers.has('X-Retry')).toBe(true);
        retryReq.flush({}, { status: 401, statusText: 'Unauthorized' });

        expect(authService.clearAuth).toHaveBeenCalled();
        expect(authService.navigateToLogin).toHaveBeenCalled();
    });

    it('should not attach token if no token in storage', () => {
        httpClient.get('/api/protected').subscribe();

        const req = httpMock.expectOne('/api/protected');
        expect(req.request.headers.has('Authorization')).toBe(false);
        req.flush({});
    });
});
