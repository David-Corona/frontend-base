import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@shared/services/auth.service';
import { authGuard, publicAuthGuard, adminGuard } from './auth.guard';
import { signal, WritableSignal } from '@angular/core';

describe('authGuard', () => {
    let authService: AuthService;
    let routerMock: { navigate: jest.Mock };
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = { url: '/dashboard' } as RouterStateSnapshot;

    beforeEach(() => {
        routerMock = { navigate: jest.fn() };
        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: { isAuthenticated: signal(false) as WritableSignal<boolean> } },
                { provide: Router, useValue: routerMock }
            ]
        });
        authService = TestBed.inject(AuthService);
    });

    it('should allow authenticated users', () => {
        (authService.isAuthenticated as WritableSignal<boolean>).set(true);

        const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
        expect(result).toBe(true);
    });

    it('should redirect unauthenticated users to login with returnUrl', () => {
        (authService.isAuthenticated as WritableSignal<boolean>).set(false);

        const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
        expect(result).toBe(false);
        expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login'], {
            queryParams: { returnUrl: '/dashboard' }
        });
    });
});

describe('publicAuthGuard', () => {
    let authService: AuthService;
    let routerMock: { navigate: jest.Mock };
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = {} as RouterStateSnapshot;

    beforeEach(() => {
        routerMock = { navigate: jest.fn() };
        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: { isAuthenticated: signal(false) as WritableSignal<boolean> } },
                { provide: Router, useValue: routerMock }
            ]
        });
        authService = TestBed.inject(AuthService);
    });

    it('should allow unauthenticated users', () => {
        (authService.isAuthenticated as WritableSignal<boolean>).set(false);

        const result = TestBed.runInInjectionContext(() => publicAuthGuard(mockRoute, mockState));
        expect(result).toBe(true);
    });

    it('should redirect authenticated users to home', () => {
        (authService.isAuthenticated as WritableSignal<boolean>).set(true);

        const result = TestBed.runInInjectionContext(() => publicAuthGuard(mockRoute, mockState));
        expect(result).toBe(false);
        expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
    });
});

describe('adminGuard', () => {
    let authService: AuthService;
    let routerMock: { navigate: jest.Mock };
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = {} as RouterStateSnapshot;

    beforeEach(() => {
        routerMock = { navigate: jest.fn() };
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        hasAnyPermission: jest.fn()
                    }
                },
                { provide: Router, useValue: routerMock }
            ]
        });
        authService = TestBed.inject(AuthService);
    });

    it('should allow access when user has users:read permission', () => {
        (authService.hasAnyPermission as jest.Mock).mockReturnValue(true);

        const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
        expect(result).toBe(true);
    });

    it('should deny access and navigate to / when user lacks both permissions', () => {
        (authService.hasAnyPermission as jest.Mock).mockReturnValue(false);

        const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
        expect(result).toBe(false);
        expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should deny access when hasAnyPermission returns false', () => {
        (authService.hasAnyPermission as jest.Mock).mockReturnValue(false);

        const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
        expect(result).toBe(false);
        expect(authService.hasAnyPermission).toHaveBeenCalledWith('users:read', 'roles:read');
    });
});
