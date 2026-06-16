import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { SecurityComponent } from './security.component';
import { AuthService } from '@shared/services/auth.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import type { ApiError } from '@shared/models/api.models';

describe('SecurityComponent', () => {
    let component: SecurityComponent;
    let fixture: ComponentFixture<SecurityComponent>;
    let authServiceMock: {
        changePassword: jest.Mock;
        getSessions: jest.Mock;
    };
    let messageServiceMock: { add: jest.Mock };

    beforeEach(() => {
        authServiceMock = {
            changePassword: jest.fn(),
            getSessions: jest.fn().mockReturnValue(of({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }))
        };
        messageServiceMock = { add: jest.fn() };

        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                ButtonModule,
                InputTextModule,
                PasswordModule,
                CardModule
            ],
            providers: [
                { provide: AuthService, useValue: authServiceMock },
                { provide: MessageService, useValue: messageServiceMock }
            ]
        }).overrideComponent(SecurityComponent, {
            set: {
                imports: [
                    ReactiveFormsModule,
                    ButtonModule,
                    InputTextModule,
                    PasswordModule,
                    CardModule
                ]
            }
        });

        fixture = TestBed.createComponent(SecurityComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have invalid form when empty', () => {
        expect(component.passwordForm.valid).toBe(false);
    });

    it('should have invalid form when passwords do not match', () => {
        component.passwordForm.patchValue({
            currentPassword: 'CurrentPass1',
            newPassword: 'NewPass123',
            confirmPassword: 'DifferentPass1'
        });
        expect(component.passwordForm.valid).toBe(false);
        expect(component.passwordForm.errors?.['passwordMismatch']).toBeTruthy();
    });

    it('should have invalid form when new password is too short', () => {
        component.passwordForm.patchValue({
            currentPassword: 'CurrentPass1',
            newPassword: 'Short1',
            confirmPassword: 'Short1'
        });
        expect(component.passwordForm.valid).toBe(false);
        expect(component.passwordForm.get('newPassword')?.errors?.['minlength']).toBeTruthy();
    });

    it('should have invalid form when new password lacks complexity', () => {
        component.passwordForm.patchValue({
            currentPassword: 'CurrentPass1',
            newPassword: 'lowercaseonly',
            confirmPassword: 'lowercaseonly'
        });
        expect(component.passwordForm.valid).toBe(false);
        expect(component.passwordForm.get('newPassword')?.errors?.['pattern']).toBeTruthy();
    });

    it('should have valid form when all fields are correct', () => {
        component.passwordForm.patchValue({
            currentPassword: 'CurrentPass1',
            newPassword: 'NewPass123',
            confirmPassword: 'NewPass123'
        });
        expect(component.passwordForm.valid).toBe(true);
    });

    it('should call changePassword on valid submit', () => {
        authServiceMock.changePassword.mockReturnValue(of({ accessToken: 'new-token', user: { id: '1' } }));

        component.passwordForm.patchValue({
            currentPassword: 'CurrentPass1',
            newPassword: 'NewPass123',
            confirmPassword: 'NewPass123'
        });
        component.onSubmit();

        expect(authServiceMock.changePassword).toHaveBeenCalledWith({
            currentPassword: 'CurrentPass1',
            newPassword: 'NewPass123'
        });
    });

    it('should show success toast on successful password change', () => {
        authServiceMock.changePassword.mockReturnValue(of({ accessToken: 'new-token', user: { id: '1' } }));

        component.passwordForm.patchValue({
            currentPassword: 'CurrentPass1',
            newPassword: 'NewPass123',
            confirmPassword: 'NewPass123'
        });
        component.onSubmit();

        expect(messageServiceMock.add).toHaveBeenCalledWith({
            severity: 'success',
            summary: 'Password Updated',
            detail: 'Your password has been changed. All other sessions have been terminated.'
        });
    });

    it('should show error toast on failed password change', () => {
        const error: ApiError = {
            statusCode: 400,
            error: 'Bad Request',
            message: 'Current password is incorrect.',
            code: 'INVALID_PASSWORD'
        };
        authServiceMock.changePassword.mockReturnValue(throwError(() => error));

        component.passwordForm.patchValue({
            currentPassword: 'WrongPass1',
            newPassword: 'NewPass123',
            confirmPassword: 'NewPass123'
        });
        component.onSubmit();

        expect(messageServiceMock.add).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Update Failed',
            detail: 'Current password is incorrect.'
        });
    });

    it('should not submit when form is invalid', () => {
        component.onSubmit();
        expect(authServiceMock.changePassword).not.toHaveBeenCalled();
    });
});
