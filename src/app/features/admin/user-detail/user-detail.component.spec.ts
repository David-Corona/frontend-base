import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { UserDetailComponent } from './user-detail.component';
import { AuthService } from '@shared/services/auth.service';
import { UserService } from '@shared/services/user.service';
import { RoleService } from '@shared/services/role.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { User } from '@shared/models/user.models';
import type { Role } from '@shared/models/role.models';
import type { PaginatedResponse } from '@shared/models/api.models';

const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    isActive: true,
    isVerified: true,
    role: { id: '1', name: 'admin' },
    permissions: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
};

const mockRoles: PaginatedResponse<Role> = {
    data: [
        { id: '1', name: 'admin', description: 'Admin role', permissions: [] },
        { id: '2', name: 'user', description: 'User role', permissions: [] }
    ],
    meta: { total: 2, page: 1, limit: 100, totalPages: 1 }
};

describe('UserDetailComponent', () => {
    let component: UserDetailComponent;
    let fixture: ComponentFixture<UserDetailComponent>;
    let authServiceMock: {
        hasPermission: jest.Mock;
    };
    let userServiceMock: {
        getUser: jest.Mock;
        updateUser: jest.Mock;
        assignRole: jest.Mock;
        deactivateUser: jest.Mock;
        activateUser: jest.Mock;
    };
    let roleServiceMock: {
        getRoles: jest.Mock;
    };
    let routerMock: { navigate: jest.Mock };
    let messageServiceMock: { add: jest.Mock };

    beforeEach(() => {
        authServiceMock = {
            hasPermission: jest.fn().mockReturnValue(true)
        };
        userServiceMock = {
            getUser: jest.fn().mockReturnValue(of(mockUser)),
            updateUser: jest.fn(),
            assignRole: jest.fn(),
            deactivateUser: jest.fn(),
            activateUser: jest.fn()
        };
        roleServiceMock = {
            getRoles: jest.fn().mockReturnValue(of(mockRoles))
        };
        routerMock = { navigate: jest.fn() };
        messageServiceMock = { add: jest.fn() };

        TestBed.configureTestingModule({
            imports: [
                CommonModule,
                FormsModule,
                ReactiveFormsModule,
                ButtonModule,
                InputTextModule,
                CardModule,
                TagModule,
                SelectModule,
                ConfirmDialogModule
            ],
            providers: [
                { provide: AuthService, useValue: authServiceMock },
                { provide: UserService, useValue: userServiceMock },
                { provide: RoleService, useValue: roleServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: MessageService, useValue: messageServiceMock },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
                ConfirmationService
            ]
        }).overrideComponent(UserDetailComponent, {
            set: {
                imports: [
                    CommonModule,
                    FormsModule,
                    ReactiveFormsModule,
                    ButtonModule,
                    InputTextModule,
                    CardModule,
                    TagModule,
                    SelectModule,
                    ConfirmDialogModule
                ],
                providers: [ConfirmationService]
            }
        });

        fixture = TestBed.createComponent(UserDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load user on init', () => {
        expect(userServiceMock.getUser).toHaveBeenCalledWith('1');
        expect(component.user()?.email).toBe('test@example.com');
    });

    it('should load roles on init', () => {
        expect(roleServiceMock.getRoles).toHaveBeenCalledWith(1, 100);
        expect(component.roles().length).toBe(2);
    });

    it('should show error toast when roles fail to load', () => {
        TestBed.resetTestingModule();
        roleServiceMock.getRoles.mockReturnValue(throwError(() => new Error('Failed')));

        TestBed.configureTestingModule({
            imports: [
                CommonModule,
                FormsModule,
                ReactiveFormsModule,
                ButtonModule,
                InputTextModule,
                CardModule,
                TagModule,
                SelectModule,
                ConfirmDialogModule
            ],
            providers: [
                { provide: AuthService, useValue: authServiceMock },
                { provide: UserService, useValue: userServiceMock },
                { provide: RoleService, useValue: roleServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: MessageService, useValue: messageServiceMock },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
                ConfirmationService
            ]
        }).overrideComponent(UserDetailComponent, {
            set: {
                imports: [
                    CommonModule,
                    FormsModule,
                    ReactiveFormsModule,
                    ButtonModule,
                    InputTextModule,
                    CardModule,
                    TagModule,
                    SelectModule,
                    ConfirmDialogModule
                ],
                providers: [ConfirmationService]
            }
        });

        const newFixture = TestBed.createComponent(UserDetailComponent);
        newFixture.detectChanges();

        expect(messageServiceMock.add).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load roles.'
        });
    });

    it('should allow empty name (no required validator)', () => {
        expect(component.nameForm.get('name')?.hasError('required')).toBe(false);
    });

    it('should save name with null when empty', () => {
        userServiceMock.updateUser.mockReturnValue(of({ ...mockUser, name: null }));
        component.startEditName();
        component.nameForm.patchValue({ name: '' });
        component.saveName();
        expect(userServiceMock.updateUser).toHaveBeenCalledWith('1', { name: null });
    });

    it('should save name with trimmed value', () => {
        userServiceMock.updateUser.mockReturnValue(of({ ...mockUser, name: 'New Name' }));
        component.startEditName();
        component.nameForm.patchValue({ name: '  New Name  ' });
        component.saveName();
        expect(userServiceMock.updateUser).toHaveBeenCalledWith('1', { name: 'New Name' });
    });

    it('should navigate to user list on goBack', () => {
        component.goBack();
        expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/users']);
    });

    it('should redirect to user list when no id in route', () => {
        TestBed.resetTestingModule();

        TestBed.configureTestingModule({
            imports: [
                CommonModule,
                FormsModule,
                ReactiveFormsModule,
                ButtonModule,
                InputTextModule,
                CardModule,
                TagModule,
                SelectModule,
                ConfirmDialogModule
            ],
            providers: [
                { provide: AuthService, useValue: authServiceMock },
                { provide: UserService, useValue: userServiceMock },
                { provide: RoleService, useValue: roleServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: MessageService, useValue: messageServiceMock },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
                ConfirmationService
            ]
        }).overrideComponent(UserDetailComponent, {
            set: {
                imports: [
                    CommonModule,
                    FormsModule,
                    ReactiveFormsModule,
                    ButtonModule,
                    InputTextModule,
                    CardModule,
                    TagModule,
                    SelectModule,
                    ConfirmDialogModule
                ],
                providers: [ConfirmationService]
            }
        });

        const newFixture = TestBed.createComponent(UserDetailComponent);
        newFixture.detectChanges();

        expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/users']);
    });
});
