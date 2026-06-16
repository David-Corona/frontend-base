import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '@shared/services/auth.service';
import { ToastNotificationService } from '@shared/services/toast-notification.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import type { ApiError } from '@shared/models/api.models';

describe('RegisterComponent', () => {
    let component: RegisterComponent;
    let fixture: ComponentFixture<RegisterComponent>;
    let authServiceMock: { register: jest.Mock; isLoading: jest.Mock };
    let routerMock: { navigate: jest.Mock };
    let toastNotificationMock: { set: jest.Mock };

    beforeEach(() => {
        authServiceMock = { register: jest.fn(), isLoading: jest.fn().mockReturnValue(false) };
        routerMock = { navigate: jest.fn() };
        toastNotificationMock = { set: jest.fn() };

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
                { provide: ToastNotificationService, useValue: toastNotificationMock }
            ]
        }).overrideComponent(RegisterComponent, {
            set: { imports: [ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule, MessageModule, RippleModule] }
        });

        fixture = TestBed.createComponent(RegisterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have invalid form when empty', () => {
        expect(component.registerForm.valid).toBe(false);
    });

    it('should have invalid form when email format is invalid', () => {
        component.registerForm.patchValue({
            email: 'not-an-email',
            password: 'Password123',
            confirmPassword: 'Password123'
        });
        expect(component.registerForm.valid).toBe(false);
        expect(component.registerForm.get('email')?.hasError('email')).toBe(true);
    });

    it('should have invalid form when password is too short', () => {
        component.registerForm.patchValue({
            email: 'test@example.com',
            password: 'short',
            confirmPassword: 'short'
        });
        expect(component.registerForm.valid).toBe(false);
        expect(component.registerForm.get('password')?.hasError('minlength')).toBe(true);
    });

    it('should have valid form when filled correctly', () => {
        component.registerForm.patchValue({
            email: 'test@example.com',
            password: 'Password123',
            confirmPassword: 'Password123'
        });
        expect(component.registerForm.valid).toBe(true);
    });

    it('should have invalid form when passwords do not match', () => {
        component.registerForm.patchValue({
            email: 'test@example.com',
            password: 'Password123',
            confirmPassword: 'DifferentPassword'
        });
        expect(component.registerForm.valid).toBe(false);
        expect(component.registerForm.hasError('passwordMismatch')).toBe(true);
    });

    it('should not submit when form is invalid', () => {
        component.onSubmit();
        expect(authServiceMock.register).not.toHaveBeenCalled();
    });

    it('should navigate to login on successful registration', () => {
        const response = { message: 'Registration successful' };
        authServiceMock.register.mockReturnValue(of(response));

        component.registerForm.patchValue({
            email: 'test@example.com',
            password: 'Password123',
            confirmPassword: 'Password123'
        });
        component.onSubmit();

        expect(authServiceMock.register).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'Password123'
        });
        expect(toastNotificationMock.set).toHaveBeenCalledWith({
            severity: 'success',
            summary: 'Registration Successful',
            detail: 'We sent a verification link to your email. Please check your inbox.'
        });
        expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { email: 'test@example.com' } });
    });

    it('should show error message on registration failure', () => {
        const error: ApiError = {
            statusCode: 400,
            error: 'Bad Request',
            message: 'Email already exists.',
            code: 'USER_ALREADY_EXISTS'
        };
        authServiceMock.register.mockReturnValue(throwError(() => error));

        component.registerForm.patchValue({
            email: 'test@example.com',
            password: 'Password123',
            confirmPassword: 'Password123'
        });
        component.onSubmit();

        expect(component.errorMessage()).toBe('Email already exists.');
    });

    it('should show generic error message when error has no message', () => {
        const error: ApiError = {
            statusCode: 500,
            error: 'Internal Server Error',
            message: '',
            code: 'INTERNAL_SERVER_ERROR'
        };
        authServiceMock.register.mockReturnValue(throwError(() => error));

        component.registerForm.patchValue({
            email: 'test@example.com',
            password: 'Password123',
            confirmPassword: 'Password123'
        });
        component.onSubmit();

        expect(component.errorMessage()).toBe('Registration failed. Please try again.');
    });
});
