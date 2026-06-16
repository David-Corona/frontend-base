import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '@shared/services/auth.service';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import type { ApiError } from '@shared/models/api.models';

describe('ResetPasswordComponent', () => {
    let component: ResetPasswordComponent;
    let fixture: ComponentFixture<ResetPasswordComponent>;
    let authServiceMock: { resetPassword: jest.Mock; isLoading: jest.Mock };

    const createComponentWithToken = (token: string | null) => {
        TestBed.resetTestingModule();
        const route = {
            snapshot: {
                queryParamMap: {
                    get: (key: string) => key === 'token' ? token : null
                }
            }
        };

        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                RouterModule,
                ButtonModule,
                PasswordModule,
                MessageModule,
                RippleModule
            ],
            providers: [
                { provide: AuthService, useValue: authServiceMock },
                { provide: ActivatedRoute, useValue: route }
            ]
        }).overrideComponent(ResetPasswordComponent, {
            set: { imports: [ReactiveFormsModule, RouterModule, ButtonModule, PasswordModule, MessageModule, RippleModule] }
        });

        const newFixture = TestBed.createComponent(ResetPasswordComponent);
        const newComponent = newFixture.componentInstance;
        newFixture.detectChanges();
        return { component: newComponent, fixture: newFixture };
    };

    beforeEach(() => {
        authServiceMock = { resetPassword: jest.fn(), isLoading: jest.fn().mockReturnValue(false) };

        const result = createComponentWithToken('valid-token');
        component = result.component;
        fixture = result.fixture;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have invalid form when empty', () => {
        expect(component.resetPasswordForm.valid).toBe(false);
    });

    it('should have invalid form when password is too short', () => {
        component.resetPasswordForm.patchValue({
            password: 'short',
            confirmPassword: 'short'
        });
        expect(component.resetPasswordForm.valid).toBe(false);
        expect(component.resetPasswordForm.get('password')?.hasError('minlength')).toBe(true);
    });

    it('should have invalid form when passwords do not match', () => {
        component.resetPasswordForm.patchValue({
            password: 'Password123',
            confirmPassword: 'DifferentPassword'
        });
        expect(component.resetPasswordForm.valid).toBe(false);
        expect(component.resetPasswordForm.hasError('passwordMismatch')).toBe(true);
    });

    it('should have valid form when filled correctly', () => {
        component.resetPasswordForm.patchValue({
            password: 'Password123',
            confirmPassword: 'Password123'
        });
        expect(component.resetPasswordForm.valid).toBe(true);
    });

    it('should not submit when form is invalid', () => {
        component.onSubmit();
        expect(authServiceMock.resetPassword).not.toHaveBeenCalled();
    });

    it('should show missing token state when no token is provided', () => {
        const result = createComponentWithToken(null);
        expect(result.component.token()).toBeNull();
    });

    it('should set isSubmitted on successful reset', () => {
        const response = { message: 'Password reset successful' };
        authServiceMock.resetPassword.mockReturnValue(of(response));

        component.resetPasswordForm.patchValue({
            password: 'Password123',
            confirmPassword: 'Password123'
        });
        component.onSubmit();

        expect(authServiceMock.resetPassword).toHaveBeenCalledWith({
            token: 'valid-token',
            newPassword: 'Password123'
        });
        expect(component.isSubmitted()).toBe(true);
        expect(component.errorMessage()).toBeNull();
    });

    it('should show error message on reset failure', () => {
        const error: ApiError = {
            statusCode: 400,
            error: 'Bad Request',
            message: 'Invalid or expired token.',
            code: 'TOKEN_EXPIRED'
        };
        authServiceMock.resetPassword.mockReturnValue(throwError(() => error));

        component.resetPasswordForm.patchValue({
            password: 'Password123',
            confirmPassword: 'Password123'
        });
        component.onSubmit();

        expect(component.errorMessage()).toBe('Invalid or expired token.');
        expect(component.isSubmitted()).toBe(false);
    });

    it('should show generic error message when error has no message', () => {
        const error: ApiError = {
            statusCode: 500,
            error: 'Internal Server Error',
            message: '',
            code: 'INTERNAL_SERVER_ERROR'
        };
        authServiceMock.resetPassword.mockReturnValue(throwError(() => error));

        component.resetPasswordForm.patchValue({
            password: 'Password123',
            confirmPassword: 'Password123'
        });
        component.onSubmit();

        expect(component.errorMessage()).toBe('Could not reset password. Please try again.');
    });
});
