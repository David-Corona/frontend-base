import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import type { User } from '@shared/models/user.models';
import type { LoginRequest, LoginResponse } from '@shared/models/auth.models';

const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    isActive: true,
    isVerified: true,
    role: { id: '1', name: 'user' },
    permissions: ['users:read'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
};

describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;
    let routerMock: { navigate: jest.Mock; navigateByUrl: jest.Mock };

    beforeEach(() => {
        routerMock = { navigate: jest.fn(), navigateByUrl: jest.fn() };
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                AuthService,
                { provide: Router, useValue: routerMock }
            ]
        });
        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);
        localStorage.clear();
    });

    afterEach(() => {
        httpMock.verify();
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('login', () => {
        it('should store token and user on success', () => {
            const request: LoginRequest = { email: 'test@example.com', password: 'password' };
            const response: LoginResponse = { accessToken: 'token123', user: mockUser };

            service.login(request).subscribe((res) => {
                expect(res).toEqual(response);
                expect(service.isAuthenticated()).toBe(true);
                expect(service.currentUser()).toEqual(mockUser);
                expect(service.getAccessToken()).toBe('token123');
            });

            const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
            expect(req.request.method).toBe('POST');
            req.flush(response);
        });

        it('should handle login error', () => {
            const request: LoginRequest = { email: 'test@example.com', password: 'wrong' };

            service.login(request).subscribe({
                error: (error) => {
                    expect(error.status).toBe(401);
                }
            });

            const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
            req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
        });
    });

    describe('refreshToken', () => {
        it('should store new access token and user', () => {
            service.refreshToken().subscribe((res) => {
                expect(res.accessToken).toBe('newToken');
                expect(service.getAccessToken()).toBe('newToken');
                expect(service.currentUser()).toEqual(mockUser);
                expect(service.isAuthenticated()).toBe(true);
            });

            const req = httpMock.expectOne('http://localhost:3000/api/auth/refresh');
            expect(req.request.method).toBe('POST');
            expect(req.request.withCredentials).toBe(true);
            req.flush({ accessToken: 'newToken', user: mockUser });
        });
    });

    describe('logout', () => {
        it('should clear auth and call logout endpoint', () => {
            localStorage.setItem('access_token', 'token123');
            localStorage.setItem('user', JSON.stringify(mockUser));

            service.logout().subscribe(() => {
                expect(service.isAuthenticated()).toBe(false);
                expect(service.currentUser()).toBeNull();
                expect(service.getAccessToken()).toBeNull();
            });

            const req = httpMock.expectOne('http://localhost:3000/api/auth/logout');
            expect(req.request.method).toBe('POST');
            expect(req.request.withCredentials).toBe(true);
            req.flush(null, { status: 204, statusText: 'No Content' });
        });

        it('should clear auth even if logout fails', () => {
            localStorage.setItem('access_token', 'token123');

            service.logout().subscribe(() => {
                expect(service.isAuthenticated()).toBe(false);
                expect(service.getAccessToken()).toBeNull();
            });

            const req = httpMock.expectOne('http://localhost:3000/api/auth/logout');
            req.flush(null, { status: 500, statusText: 'Internal Server Error' });
        });
    });

    describe('initializeAuth', () => {
        it('should restore auth from localStorage', () => {
            localStorage.setItem('access_token', 'token123');
            localStorage.setItem('user', JSON.stringify(mockUser));

            service.initializeAuth().subscribe();

            expect(service.isAuthenticated()).toBe(true);
            expect(service.currentUser()).toEqual(mockUser);
        });

        it('should clear auth if user is invalid JSON', () => {
            localStorage.setItem('access_token', 'token123');
            localStorage.setItem('user', 'invalid json');

            service.initializeAuth().subscribe();

            expect(service.isAuthenticated()).toBe(false);
            expect(service.getAccessToken()).toBeNull();
        });

        it('should attempt silent refresh when token is expired', () => {
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjB9.signature';
            localStorage.setItem('access_token', expiredToken);
            localStorage.setItem('user', JSON.stringify(mockUser));

            service.initializeAuth().subscribe();

            const req = httpMock.expectOne('http://localhost:3000/api/auth/refresh');
            req.flush({ accessToken: 'newToken', user: mockUser });

            expect(service.isAuthenticated()).toBe(true);
            expect(service.currentUser()).toEqual(mockUser);
            expect(service.getAccessToken()).toBe('newToken');
        });

        it('should clear auth when token is expired and refresh fails', () => {
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjB9.signature';
            localStorage.setItem('access_token', expiredToken);
            localStorage.setItem('user', JSON.stringify(mockUser));

            service.initializeAuth().subscribe();

            const req = httpMock.expectOne('http://localhost:3000/api/auth/refresh');
            req.flush({}, { status: 401, statusText: 'Unauthorized' });

            expect(service.isAuthenticated()).toBe(false);
            expect(service.getAccessToken()).toBeNull();
        });
    });

    describe('navigateToLogin', () => {
        it('should navigate to login with returnUrl', () => {
            service.navigateToLogin('/dashboard');
            expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { returnUrl: '/dashboard' } });
        });

        it('should navigate to login without returnUrl', () => {
            service.navigateToLogin();
            expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: {} });
        });
    });

    describe('hasPermission', () => {
        it('should return true when user has the permission', () => {
            localStorage.setItem('access_token', 'token123');
            localStorage.setItem('user', JSON.stringify(mockUser));
            service.initializeAuth().subscribe();

            expect(service.hasPermission('users:read')).toBe(true);
        });

        it('should return false when user does not have the permission', () => {
            localStorage.setItem('access_token', 'token123');
            localStorage.setItem('user', JSON.stringify(mockUser));
            service.initializeAuth().subscribe();

            expect(service.hasPermission('users:delete')).toBe(false);
        });

        it('should return false when no user is authenticated', () => {
            expect(service.hasPermission('users:read')).toBe(false);
        });
    });

    describe('updateUserInStorage', () => {
        it('should update localStorage and current user signal', () => {
            localStorage.setItem('access_token', 'token123');
            localStorage.setItem('user', JSON.stringify(mockUser));
            service.initializeAuth().subscribe();

            const updatedUser = { ...mockUser, name: 'New Name' };
            service.updateUserInStorage(updatedUser);

            expect(service.currentUser()?.name).toBe('New Name');
            expect(JSON.parse(localStorage.getItem('user')!).name).toBe('New Name');
        });
    });

    describe('hasAnyPermission', () => {
        it('should return true when user has at least one of the permissions', () => {
            localStorage.setItem('access_token', 'token123');
            localStorage.setItem('user', JSON.stringify(mockUser));
            service.initializeAuth().subscribe();

            expect(service.hasAnyPermission('users:delete', 'users:read')).toBe(true);
        });

        it('should return false when user has none of the permissions', () => {
            localStorage.setItem('access_token', 'token123');
            localStorage.setItem('user', JSON.stringify(mockUser));
            service.initializeAuth().subscribe();

            expect(service.hasAnyPermission('users:delete', 'roles:write')).toBe(false);
        });

        it('should return false when no user is authenticated', () => {
            expect(service.hasAnyPermission('users:read')).toBe(false);
        });
    });

    describe('changePassword', () => {
        it('should change password and update tokens', () => {
            localStorage.setItem('access_token', 'oldToken');
            localStorage.setItem('user', JSON.stringify(mockUser));

            service.changePassword({ currentPassword: 'OldPass1', newPassword: 'NewPass1' }).subscribe((res) => {
                expect(res.accessToken).toBe('newAccessToken');
                expect(service.getAccessToken()).toBe('newAccessToken');
                expect(service.currentUser()).toEqual(mockUser);
            });

            const req = httpMock.expectOne('http://localhost:3000/api/auth/change-password');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ currentPassword: 'OldPass1', newPassword: 'NewPass1' });
            req.flush({ accessToken: 'newAccessToken', user: mockUser });
        });

        it('should handle change password error', () => {
            service.changePassword({ currentPassword: 'wrong', newPassword: 'NewPass1' }).subscribe({
                error: (error) => {
                    expect(error.status).toBe(401);
                }
            });

            const req = httpMock.expectOne('http://localhost:3000/api/auth/change-password');
            req.flush({ message: 'Invalid password' }, { status: 401, statusText: 'Unauthorized' });
        });
    });
});
