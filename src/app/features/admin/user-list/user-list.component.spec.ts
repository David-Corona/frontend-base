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
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
    let userServiceMock: { getUsers: jest.Mock; deactivateUser: jest.Mock; activateUser: jest.Mock };
    let routerMock: { navigate: jest.Mock };
    let messageServiceMock: { add: jest.Mock };

    beforeEach(() => {
        userServiceMock = {
            getUsers: jest.fn().mockReturnValue(of(mockResponse)),
            deactivateUser: jest.fn(),
            activateUser: jest.fn()
        };
        routerMock = { navigate: jest.fn() };
        messageServiceMock = { add: jest.fn() };

        TestBed.configureTestingModule({
            imports: [
                CommonModule,
                FormsModule,
                TableModule,
                ButtonModule,
                TagModule,
                SelectModule,
                InputTextModule,
                ConfirmDialogModule,
                TooltipModule
            ],
            providers: [
                { provide: UserService, useValue: userServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: MessageService, useValue: messageServiceMock },
                ConfirmationService
            ]
        }).overrideComponent(UserListComponent, {
            set: {
                imports: [
                    CommonModule,
                    FormsModule,
                    TableModule,
                    ButtonModule,
                    TagModule,
                    SelectModule,
                    InputTextModule,
                    ConfirmDialogModule,
                    TooltipModule
                ],
                providers: [ConfirmationService]
            }
        });

        fixture = TestBed.createComponent(UserListComponent);
        component = fixture.componentInstance;
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
        userServiceMock.getUsers.mockReturnValue(throwError(() => new Error('Failed')));
        component.loadUsers();
        expect(messageServiceMock.add).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load users.'
        });
    });
});
