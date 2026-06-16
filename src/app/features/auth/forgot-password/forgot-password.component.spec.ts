import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '@shared/services/auth.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import type { ApiError } from '@shared/models/api.models';

describe('ForgotPasswordComponent', () => {
    let component: ForgotPasswordComponent;
    let fixture: ComponentFixture<ForgotPasswordComponent>;
    let authServiceMock: { forgotPassword: jest.Mock; isLoading: jest.Mock };

    beforeEach(() => {
        authServiceMock = { forgotPassword: jest.fn(), isLoading: jest.fn().mockReturnValue(false) };

        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                RouterModule,
                ButtonModule,
                InputTextModule,
                MessageModule,
                RippleModule
            ],
            providers: [
                { provide: AuthService, useValue: authServiceMock },
                { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } }
            ]
        }).overrideComponent(ForgotPasswordComponent, {
            set: { imports: [ReactiveFormsModule, RouterModule, ButtonModule, InputTextModule, MessageModule, RippleModule] }
        });

        fixture = TestBed.createComponent(ForgotPasswordComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have invalid form when empty', () => {
        expect(component.forgotPasswordForm.valid).toBe(false);
    });

    it('should have invalid form when email format is invalid', () => {
        component.forgotPasswordForm.patchValue({ email: 'not-an-email' });
        expect(component.forgotPasswordForm.valid).toBe(false);
        expect(component.forgotPasswordForm.get('email')?.hasError('email')).toBe(true);
    });

    it('should have valid form when email is correct', () => {
        component.forgotPasswordForm.patchValue({ email: 'test@example.com' });
        expect(component.forgotPasswordForm.valid).toBe(true);
    });

    it('should not submit when form is invalid', () => {
        component.onSubmit();
        expect(authServiceMock.forgotPassword).not.toHaveBeenCalled();
    });

    it('should set isSubmitted on successful request', () => {
        const response = { message: 'Reset link sent' };
        authServiceMock.forgotPassword.mockReturnValue(of(response));

        component.forgotPasswordForm.patchValue({ email: 'test@example.com' });
        component.onSubmit();

        expect(authServiceMock.forgotPassword).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(component.isSubmitted()).toBe(true);
        expect(component.errorMessage()).toBeNull();
    });

    it('should show error message on failure', () => {
        const error: ApiError = {
            statusCode: 400,
            error: 'Bad Request',
            message: 'Could not process request.',
            code: 'BAD_REQUEST'
        };
        authServiceMock.forgotPassword.mockReturnValue(throwError(() => error));

        component.forgotPasswordForm.patchValue({ email: 'test@example.com' });
        component.onSubmit();

        expect(component.errorMessage()).toBe('Could not process request.');
        expect(component.isSubmitted()).toBe(false);
    });

    it('should show generic error message when error has no message', () => {
        const error: ApiError = {
            statusCode: 500,
            error: 'Internal Server Error',
            message: '',
            code: 'INTERNAL_SERVER_ERROR'
        };
        authServiceMock.forgotPassword.mockReturnValue(throwError(() => error));

        component.forgotPasswordForm.patchValue({ email: 'test@example.com' });
        component.onSubmit();

        expect(component.errorMessage()).toBe('Could not send reset link. Please try again.');
    });
});
