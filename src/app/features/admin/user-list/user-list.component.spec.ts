import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UserListComponent } from './user-list.component';
import { UserService } from '@shared/services/user.service';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { PasswordModule } from 'primeng/password';
import { RoleService } from '@shared/services/role.service';
import type { User } from '@shared/models/user.models';
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

const mockResponse: PaginatedResponse<User> = {
    data: [mockUser],
    meta: { total: 1, page: 1, limit: 25, totalPages: 1 }
};

describe('UserListComponent', () => {
    let component: UserListComponent;
    let fixture: ComponentFixture<UserListComponent>;
    let userServiceMock: { getUsers: jest.Mock; deactivateUser: jest.Mock; activateUser: jest.Mock; createUser: jest.Mock };
    let routerMock: { navigate: jest.Mock };
    let roleServiceMock: { getRoles: jest.Mock };
    let messageService: MessageService;

    beforeEach(() => {
        userServiceMock = {
            getUsers: jest.fn().mockReturnValue(of(mockResponse)),
            deactivateUser: jest.fn(),
            activateUser: jest.fn(),
            createUser: jest.fn().mockReturnValue(of(mockUser))
        };
        routerMock = { navigate: jest.fn() };
        roleServiceMock = { getRoles: jest.fn().mockReturnValue(of({ data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 1 } })) };

        TestBed.configureTestingModule({
            imports: [
                CommonModule,
                FormsModule,
                ReactiveFormsModule,
                TableModule,
                ButtonModule,
                TagModule,
                SelectModule,
                InputTextModule,
                ConfirmDialogModule,
                DialogModule,
                PasswordModule,
                TooltipModule
            ],
            providers: [
                { provide: UserService, useValue: userServiceMock },
                { provide: RoleService, useValue: roleServiceMock },
                { provide: Router, useValue: routerMock },
                MessageService,
                ConfirmationService
            ]
        }).overrideComponent(UserListComponent, {
            set: {
                imports: [
                    CommonModule,
                    FormsModule,
                    ReactiveFormsModule,
                    TableModule,
                    ButtonModule,
                    TagModule,
                    SelectModule,
                    InputTextModule,
                    ConfirmDialogModule,
                    DialogModule,
                    PasswordModule,
                    TooltipModule
                ],
                providers: [ConfirmationService]
            }
        });

        fixture = TestBed.createComponent(UserListComponent);
        component = fixture.componentInstance;
        messageService = TestBed.inject(MessageService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load users on init', () => {
        expect(userServiceMock.getUsers).toHaveBeenCalled();
        expect(component.users().length).toBe(1);
    });

    it('should navigate to user detail on view', () => {
        component.viewUser(mockUser);
        expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/users', '1']);
    });

    it('should show error toast on failed user load', () => {
        const addSpy = jest.spyOn(messageService, 'add');
        userServiceMock.getUsers.mockReturnValue(throwError(() => new Error('Failed')));
        component.loadUsers();
        expect(addSpy).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load users.'
        });
    });

    it('should open create dialog', () => {
        component.openCreateDialog();
        expect(component.showCreateDialog()).toBe(true);
        expect(component.createForm.pristine).toBe(true);
    });

    it('should close create dialog', () => {
        component.openCreateDialog();
        component.closeCreateDialog();
        expect(component.showCreateDialog()).toBe(false);
    });

    it('should create user and refresh list on success', () => {
        const addSpy = jest.spyOn(messageService, 'add');
        component.openCreateDialog();
        component.createForm.patchValue({
            email: 'new@example.com',
            password: 'Password123',
            name: 'New User',
            roleId: 'role-1'
        });
        component.submitCreate();
        expect(userServiceMock.createUser).toHaveBeenCalledWith({
            email: 'new@example.com',
            password: 'Password123',
            name: 'New User',
            roleId: 'role-1'
        });
        expect(addSpy).toHaveBeenCalledWith({
            severity: 'success',
            summary: 'User Created',
            detail: 'The new user has been created successfully.'
        });
        expect(component.showCreateDialog()).toBe(false);
        expect(userServiceMock.getUsers).toHaveBeenCalled();
    });

    it('should show error toast on failed user creation', () => {
        const addSpy = jest.spyOn(messageService, 'add');
        userServiceMock.createUser.mockReturnValue(throwError(() => ({ message: 'Email already exists' } as ApiError)));
        component.openCreateDialog();
        component.createForm.patchValue({
            email: 'new@example.com',
            password: 'Password123'
        });
        component.submitCreate();
        expect(addSpy).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Failed',
            detail: 'Email already exists'
        });
        expect(component.isCreating()).toBe(false);
    });

    it('should not submit create when form is invalid', () => {
        component.openCreateDialog();
        component.createForm.patchValue({ email: 'invalid-email', password: '' });
        component.submitCreate();
        expect(userServiceMock.createUser).not.toHaveBeenCalled();
        expect(component.createForm.touched).toBe(true);
    });
});
