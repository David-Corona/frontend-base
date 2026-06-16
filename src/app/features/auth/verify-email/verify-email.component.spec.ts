import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { VerifyEmailComponent } from './verify-email.component';
import { AuthService } from '@shared/services/auth.service';
import { ToastNotificationService } from '@shared/services/toast-notification.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import type { ApiError } from '@shared/models/api.models';

describe('VerifyEmailComponent', () => {
    let component: VerifyEmailComponent;
    let fixture: ComponentFixture<VerifyEmailComponent>;
    let authServiceMock: { verifyEmail: jest.Mock; isLoading: jest.Mock };
    let routerMock: { navigate: jest.Mock };
    let toastNotificationMock: { set: jest.Mock };

    function createComponent(routeParams: { token?: string; email?: string } = {}) {
        const queryParamMap = {
            get: (key: string) => {
                if (key === 'token') return routeParams.token ?? null;
                if (key === 'email') return routeParams.email ?? null;
                return null;
            }
        };

        TestBed.configureTestingModule({
            imports: [ProgressSpinnerModule],
            providers: [
                { provide: AuthService, useValue: authServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap } } },
                { provide: ToastNotificationService, useValue: toastNotificationMock }
            ]
        }).overrideComponent(VerifyEmailComponent, {
            set: { imports: [ProgressSpinnerModule] }
        });

        const newFixture = TestBed.createComponent(VerifyEmailComponent);
        const newComponent = newFixture.componentInstance;
        newFixture.detectChanges();
        return { fixture: newFixture, component: newComponent };
    }

    beforeEach(() => {
        authServiceMock = {
            verifyEmail: jest.fn(),
            isLoading: jest.fn().mockReturnValue(false)
        };
        routerMock = { navigate: jest.fn() };
        toastNotificationMock = { set: jest.fn() };
    });

    it('should redirect to login when no token provided', () => {
        createComponent();
        expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should auto-verify and redirect to login with toast', () => {
        authServiceMock.verifyEmail.mockReturnValue(of({ message: 'Email verified successfully' }));

        createComponent({ token: 'abc123' });
        expect(authServiceMock.verifyEmail).toHaveBeenCalledWith({ token: 'abc123' });
        expect(toastNotificationMock.set).toHaveBeenCalledWith({
            severity: 'success',
            summary: 'Email Verified',
            detail: 'Your email has been verified. Please sign in.'
        });
        expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should redirect to login with toast when already verified', () => {
        const error: ApiError = {
            statusCode: 409,
            error: 'Conflict',
            message: 'Email is already verified',
            code: 'EMAIL_ALREADY_VERIFIED'
        };
        authServiceMock.verifyEmail.mockReturnValue(throwError(() => error));

        createComponent({ token: 'usedtoken' });
        expect(toastNotificationMock.set).toHaveBeenCalledWith({
            severity: 'success',
            summary: 'Email Verified',
            detail: 'Your email has been verified. Please sign in.'
        });
        expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should redirect to login with error toast when token expired', () => {
        const error: ApiError = {
            statusCode: 400,
            error: 'Bad Request',
            message: 'Token has expired',
            code: 'TOKEN_EXPIRED'
        };
        authServiceMock.verifyEmail.mockReturnValue(throwError(() => error));

        createComponent({ token: 'expiredtoken' });
        expect(toastNotificationMock.set).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Link Expired',
            detail: 'This verification link has expired. Please request a new one.'
        });
        expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should redirect to login with error toast on other failures', () => {
        const error: ApiError = {
            statusCode: 400,
            error: 'Bad Request',
            message: 'Invalid token',
            code: 'INVALID_TOKEN'
        };
        authServiceMock.verifyEmail.mockReturnValue(throwError(() => error));

        createComponent({ token: 'badtoken' });
        expect(toastNotificationMock.set).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Verification Failed',
            detail: 'Could not verify your email. Please try again.'
        });
        expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
});
