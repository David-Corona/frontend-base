import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { AuthService } from '@shared/services/auth.service';
import { UserService } from '@shared/services/user.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import type { User } from '@shared/models/user.models';
import type { ApiError } from '@shared/models/api.models';

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

describe('ProfileComponent', () => {
    let component: ProfileComponent;
    let fixture: ComponentFixture<ProfileComponent>;
    let authServiceMock: {
        currentUser: jest.Mock;
        updateUserInStorage: jest.Mock;
    };
    let userServiceMock: {
        getMe: jest.Mock;
        updateProfile: jest.Mock;
    };
    let messageServiceMock: { add: jest.Mock };

    beforeEach(() => {
        authServiceMock = {
            currentUser: jest.fn().mockReturnValue(mockUser),
            updateUserInStorage: jest.fn()
        };
        userServiceMock = {
            getMe: jest.fn().mockReturnValue(of(mockUser)),
            updateProfile: jest.fn()
        };
        messageServiceMock = { add: jest.fn() };

        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                ButtonModule,
                InputTextModule,
                CardModule,
                TagModule
            ],
            providers: [
                { provide: AuthService, useValue: authServiceMock },
                { provide: UserService, useValue: userServiceMock },
                { provide: MessageService, useValue: messageServiceMock }
            ]
        }).overrideComponent(ProfileComponent, {
            set: {
                imports: [
                    ReactiveFormsModule,
                    ButtonModule,
                    InputTextModule,
                    CardModule,
                    TagModule
                ]
            }
        });

        fixture = TestBed.createComponent(ProfileComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load user data on init', () => {
        expect(userServiceMock.getMe).toHaveBeenCalled();
        expect(authServiceMock.updateUserInStorage).toHaveBeenCalledWith(mockUser);
    });

    it('should display user name, email, and role', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.textContent).toContain('Test User');
        expect(compiled.textContent).toContain('test@example.com');
        expect(compiled.textContent).toContain('user');
    });

    it('should start editing when Edit button is clicked', () => {
        expect(component.isEditing()).toBe(false);

        component.startEditing();
        fixture.detectChanges();

        expect(component.isEditing()).toBe(true);
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('input')).toBeTruthy();
    });

    it('should revert form on cancel', () => {
        component.startEditing();
        fixture.detectChanges();

        const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
        input.value = 'Changed Name';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        component.onCancel();
        fixture.detectChanges();

        expect(component.isEditing()).toBe(false);
        expect(component.profileForm.get('name')?.value).toBe('Test User');
    });

    it('should call updateProfile on save', () => {
        const updatedUser = { ...mockUser, name: 'Updated Name' };
        userServiceMock.updateProfile.mockReturnValue(of(updatedUser));

        component.startEditing();
        fixture.detectChanges();

        component.profileForm.patchValue({ name: 'Updated Name' });
        component.onSave();

        expect(userServiceMock.updateProfile).toHaveBeenCalledWith({ name: 'Updated Name' });
        expect(authServiceMock.updateUserInStorage).toHaveBeenCalledWith(updatedUser);
    });

    it('should show success toast on save', () => {
        const updatedUser = { ...mockUser, name: 'Updated Name' };
        userServiceMock.updateProfile.mockReturnValue(of(updatedUser));

        component.startEditing();
        fixture.detectChanges();

        component.profileForm.patchValue({ name: 'Updated Name' });
        component.onSave();

        expect(messageServiceMock.add).toHaveBeenCalledWith({
            severity: 'success',
            summary: 'Profile Updated',
            detail: 'Your profile has been updated successfully.'
        });
    });

    it('should show error toast on save failure', () => {
        const error: ApiError = {
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'Failed to update profile.',
            code: 'INTERNAL_ERROR'
        };
        userServiceMock.updateProfile.mockReturnValue(throwError(() => error));

        component.startEditing();
        fixture.detectChanges();

        component.profileForm.patchValue({ name: 'Updated Name' });
        component.onSave();

        expect(messageServiceMock.add).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Update Failed',
            detail: 'Failed to update profile.'
        });
    });

    it('should block save when name is empty', () => {
        component.startEditing();
        fixture.detectChanges();

        component.profileForm.patchValue({ name: '' });
        component.onSave();

        expect(userServiceMock.updateProfile).not.toHaveBeenCalled();
        expect(component.profileForm.get('name')?.errors?.['required']).toBeTruthy();
    });

    it('should block save when name is whitespace only', () => {
        component.startEditing();
        fixture.detectChanges();

        component.profileForm.patchValue({ name: '   ' });
        component.onSave();

        expect(userServiceMock.updateProfile).not.toHaveBeenCalled();
        expect(component.profileForm.get('name')?.errors?.['required']).toBeTruthy();
    });
});
