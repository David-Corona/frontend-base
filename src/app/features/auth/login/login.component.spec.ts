import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '@shared/services/auth.service';
import { ToastNotificationService } from '@shared/services/toast-notification.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import { MessageService } from 'primeng/api';
import type { ApiError } from '@shared/models/api.models';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let authServiceMock: { login: jest.Mock; resendVerification: jest.Mock; isLoading: jest.Mock };
    let routerMock: { navigate: jest.Mock; navigateByUrl: jest.Mock };
    let toastNotificationMock: { consume: jest.Mock };

    beforeEach(() => {
        authServiceMock = { login: jest.fn(), resendVerification: jest.fn(), isLoading: jest.fn().mockReturnValue(false) };
        routerMock = { navigate: jest.fn(), navigateByUrl: jest.fn() };
        toastNotificationMock = { consume: jest.fn().mockReturnValue(null) };

        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                ButtonModule,
                InputTextModule,
                PasswordModule,
                MessageModule,
                RippleModule
            ],
            providers: [
                { provide: AuthService, useValue: authServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
                { provide: ToastNotificationService, useValue: toastNotificationMock },
                MessageService
            ]
        }).overrideComponent(LoginComponent, {
            set: { imports: [ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule, MessageModule, RippleModule] }
        });

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have invalid form when empty', () => {
        expect(component.loginForm.valid).toBe(false);
    });

    it('should have valid form when filled', () => {
        component.loginForm.patchValue({ email: 'test@example.com', password: 'password123' });
        expect(component.loginForm.valid).toBe(true);
    });

    it('should not submit when form is invalid', () => {
        component.onSubmit();
        expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('should navigate to returnUrl on successful login', () => {
        const loginResponse = { accessToken: 'token', user: { id: '1', email: 'test@example.com' } };
        authServiceMock.login.mockReturnValue(of(loginResponse as any));

        // Set returnUrl
        Object.defineProperty(component['route'], 'snapshot', {
            value: { queryParamMap: { get: (key: string) => key === 'returnUrl' ? '/dashboard' : null } }
        });

        component.loginForm.patchValue({ email: 'test@example.com', password: 'password123' });
        component.onSubmit();

        expect(authServiceMock.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
        expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    });

    it('should sanitize malicious returnUrl to home on successful login', () => {
        const loginResponse = { accessToken: 'token', user: { id: '1', email: 'test@example.com' } };
        authServiceMock.login.mockReturnValue(of(loginResponse as any));

        // Set malicious returnUrl (protocol-relative)
        Object.defineProperty(component['route'], 'snapshot', {
            value: { queryParamMap: { get: (key: string) => key === 'returnUrl' ? '//evil.com' : null } }
        });

        component.loginForm.patchValue({ email: 'test@example.com', password: 'password123' });
        component.onSubmit();

        expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('should navigate to home on successful login without returnUrl', () => {
        const loginResponse = { accessToken: 'token', user: { id: '1', email: 'test@example.com' } };
        authServiceMock.login.mockReturnValue(of(loginResponse as any));

        component.loginForm.patchValue({ email: 'test@example.com', password: 'password123' });
        component.onSubmit();

        expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('should show error message on login failure', () => {
        const error: ApiError = {
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Invalid email or password.',
            code: 'UNAUTHORIZED'
        };
        authServiceMock.login.mockReturnValue(throwError(() => error));

        component.loginForm.patchValue({ email: 'test@example.com', password: 'wrong' });
        component.onSubmit();

        expect(component.errorMessage()).toBe('Invalid email or password.');
        expect(component.isUnverified()).toBe(false);
    });

    it('should handle EMAIL_NOT_VERIFIED error', () => {
        const error: ApiError = {
            statusCode: 403,
            error: 'Forbidden',
            message: 'Email not verified',
            code: 'EMAIL_NOT_VERIFIED'
        };
        authServiceMock.login.mockReturnValue(throwError(() => error));

        component.loginForm.patchValue({ email: 'test@example.com', password: 'password123' });
        component.onSubmit();

        expect(component.errorMessage()).toBe('Please verify your email before logging in.');
        expect(component.isUnverified()).toBe(true);
        expect(component.unverifiedEmail()).toBe('test@example.com');
    });

    it('should resend verification email', () => {
        authServiceMock.resendVerification.mockReturnValue(of({ message: 'Verification email sent' }));

        component.unverifiedEmail.set('test@example.com');
        component.isUnverified.set(true);
        component.resendVerification();

        expect(authServiceMock.resendVerification).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should pre-fill email from query params on unverified redirect', () => {
        TestBed.resetTestingModule();
        const routeWithEmail = { snapshot: { queryParamMap: { get: (key: string) => key === 'email' ? 'unverified@example.com' : null } } };

        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule, MessageModule, RippleModule],
            providers: [
                { provide: AuthService, useValue: authServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: ActivatedRoute, useValue: routeWithEmail },
                { provide: ToastNotificationService, useValue: toastNotificationMock },
                MessageService
            ]
        }).overrideComponent(LoginComponent, {
            set: { imports: [ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule, MessageModule, RippleModule] }
        });

        const newFixture = TestBed.createComponent(LoginComponent);
        const newComponent = newFixture.componentInstance;
        newFixture.detectChanges();

        expect(newComponent.loginForm.value.email).toBe('unverified@example.com');
        expect(newComponent.isUnverified()).toBe(true);
        expect(newComponent.errorMessage()).toBe('Please verify your email before logging in.');
    });

    it('should show toast when pending notification exists', () => {
        TestBed.resetTestingModule();
        const pendingToast = { severity: 'success' as const, summary: 'Email Verified', detail: 'Your email has been verified.' };
        const toastMockWithPending = { consume: jest.fn().mockReturnValue(pendingToast) };

        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule, MessageModule, RippleModule],
            providers: [
                { provide: AuthService, useValue: authServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
                { provide: ToastNotificationService, useValue: toastMockWithPending },
                MessageService
            ]
        }).overrideComponent(LoginComponent, {
            set: { imports: [ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule, MessageModule, RippleModule] }
        });

        const newFixture = TestBed.createComponent(LoginComponent);
        newFixture.detectChanges();

        expect(toastMockWithPending.consume).toHaveBeenCalled();
    });
});
